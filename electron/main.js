const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let mainWindow;
let db;
let dbPath;

async function initDatabase() {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'foster-design.db');
  console.log('Database path:', dbPath);

  const SQL = await initSqlJs();
  
  let fileBuffer = null;
  if (fs.existsSync(dbPath)) {
    fileBuffer = fs.readFileSync(dbPath);
  }
  
  db = new SQL.Database(fileBuffer);

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      website TEXT,
      industry TEXT,
      status TEXT DEFAULT 'Active',
      service_categories TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_contact_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_id INTEGER REFERENCES clients(id),
      service_type TEXT NOT NULL,
      status TEXT DEFAULT 'New',
      priority TEXT DEFAULT 'Medium',
      start_date TEXT,
      due_date TEXT,
      estimated_hours REAL,
      actual_hours REAL,
      hourly_rate REAL,
      total_budget REAL,
      description TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      project_id INTEGER REFERENCES projects(id),
      status TEXT DEFAULT 'Todo',
      priority TEXT DEFAULT 'Medium',
      due_date TEXT,
      estimated_hours REAL,
      assigned_to TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
  console.log('Database initialized');
}

function saveDatabase() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  return db.getRowsModified();
}

function createWindow() {
  const iconPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '../build/icon.png');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'DevHub',
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Clients
ipcMain.handle('clients:getAll', () => {
  return queryAll('SELECT * FROM clients ORDER BY created_at DESC');
});

ipcMain.handle('clients:getById', (event, id) => {
  return queryOne('SELECT * FROM clients WHERE id = ?', [id]);
});

ipcMain.handle('clients:create', (event, client) => {
  const result = runSql(`
    INSERT INTO clients (company_name, contact_name, email, phone, address, website, industry, status, service_categories, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [client.company_name, client.contact_name, client.email, client.phone || null, client.address || null, client.website || null, client.industry || null, client.status || 'Active', client.service_categories || null, client.notes || null]);
  
  const lastId = queryOne('SELECT last_insert_rowid() as id');
  
  runSql('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)',
    ['client', lastId.id, 'created', `Created client: ${client.company_name}`]);
  
  return { id: lastId.id, ...client };
});

ipcMain.handle('clients:update', (event, client) => {
  runSql(`
    UPDATE clients SET
      company_name = ?,
      contact_name = ?,
      email = ?,
      phone = ?,
      address = ?,
      website = ?,
      industry = ?,
      status = ?,
      service_categories = ?,
      notes = ?
    WHERE id = ?
  `, [client.company_name, client.contact_name, client.email, client.phone || null, client.address || null, client.website || null, client.industry || null, client.status, client.service_categories || null, client.notes || null, client.id]);
  
  runSql('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)',
    ['client', client.id, 'updated', `Updated client: ${client.company_name}`]);
  
  return client;
});

ipcMain.handle('clients:delete', (event, id) => {
  const client = queryOne('SELECT company_name FROM clients WHERE id = ?', [id]);
  runSql('DELETE FROM clients WHERE id = ?', [id]);
  
  runSql('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)',
    ['client', id, 'deleted', `Deleted client: ${client?.company_name}`]);
  
  return { success: true };
});

// IPC Handlers for Projects
ipcMain.handle('projects:getAll', () => {
  return queryAll(`
    SELECT p.*, c.company_name as client_name 
    FROM projects p 
    LEFT JOIN clients c ON p.client_id = c.id 
    ORDER BY p.created_at DESC
  `);
});

ipcMain.handle('projects:getById', (event, id) => {
  return queryOne(`
    SELECT p.*, c.company_name as client_name 
    FROM projects p 
    LEFT JOIN clients c ON p.client_id = c.id 
    WHERE p.id = ?
  `, [id]);
});

ipcMain.handle('projects:getByClientId', (event, clientId) => {
  return queryAll('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC', [clientId]);
});

ipcMain.handle('projects:create', (event, project) => {
  runSql(`
    INSERT INTO projects (name, client_id, service_type, status, priority, start_date, due_date, estimated_hours, actual_hours, hourly_rate, total_budget, description, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [project.name, project.client_id, project.service_type, project.status || 'New', project.priority || 'Medium', project.start_date || null, project.due_date || null, project.estimated_hours || null, project.actual_hours || null, project.hourly_rate || null, project.total_budget || null, project.description || null, project.notes || null]);
  
  const lastId = queryOne('SELECT last_insert_rowid() as id');
  
  runSql('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)',
    ['project', lastId.id, 'created', `Created project: ${project.name}`]);
  
  return { id: lastId.id, ...project };
});

ipcMain.handle('projects:update', (event, project) => {
  runSql(`
    UPDATE projects SET
      name = ?,
      client_id = ?,
      service_type = ?,
      status = ?,
      priority = ?,
      start_date = ?,
      due_date = ?,
      estimated_hours = ?,
      actual_hours = ?,
      hourly_rate = ?,
      total_budget = ?,
      description = ?,
      notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [project.name, project.client_id, project.service_type, project.status, project.priority, project.start_date || null, project.due_date || null, project.estimated_hours || null, project.actual_hours || null, project.hourly_rate || null, project.total_budget || null, project.description || null, project.notes || null, project.id]);
  
  runSql('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)',
    ['project', project.id, 'updated', `Updated project: ${project.name}`]);
  
  return project;
});

ipcMain.handle('projects:delete', (event, id) => {
  const project = queryOne('SELECT name FROM projects WHERE id = ?', [id]);
  runSql('DELETE FROM projects WHERE id = ?', [id]);
  
  runSql('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)',
    ['project', id, 'deleted', `Deleted project: ${project?.name}`]);
  
  return { success: true };
});

// IPC Handlers for Tasks
ipcMain.handle('tasks:getAll', () => {
  return queryAll(`
    SELECT t.*, p.name as project_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    ORDER BY t.created_at DESC
  `);
});

ipcMain.handle('tasks:getById', (event, id) => {
  return queryOne(`
    SELECT t.*, p.name as project_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    WHERE t.id = ?
  `, [id]);
});

ipcMain.handle('tasks:getByProjectId', (event, projectId) => {
  return queryAll('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
});

ipcMain.handle('tasks:create', (event, task) => {
  runSql(`
    INSERT INTO tasks (title, description, project_id, status, priority, due_date, estimated_hours, assigned_to, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [task.title, task.description || null, task.project_id || null, task.status || 'Todo', task.priority || 'Medium', task.due_date || null, task.estimated_hours || null, task.assigned_to || null, task.tags || null]);
  
  const lastId = queryOne('SELECT last_insert_rowid() as id');
  
  runSql('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)',
    ['task', lastId.id, 'created', `Created task: ${task.title}`]);
  
  return { id: lastId.id, ...task };
});

ipcMain.handle('tasks:update', (event, task) => {
  runSql(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      project_id = ?,
      status = ?,
      priority = ?,
      due_date = ?,
      estimated_hours = ?,
      assigned_to = ?,
      tags = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [task.title, task.description || null, task.project_id || null, task.status, task.priority, task.due_date || null, task.estimated_hours || null, task.assigned_to || null, task.tags || null, task.id]);
  
  runSql('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)',
    ['task', task.id, 'updated', `Updated task: ${task.title}`]);
  
  return task;
});

ipcMain.handle('tasks:delete', (event, id) => {
  const task = queryOne('SELECT title FROM tasks WHERE id = ?', [id]);
  runSql('DELETE FROM tasks WHERE id = ?', [id]);
  
  runSql('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)',
    ['task', id, 'deleted', `Deleted task: ${task?.title}`]);
  
  return { success: true };
});

// IPC Handlers for Dashboard Stats
ipcMain.handle('dashboard:getStats', () => {
  const totalClients = queryOne('SELECT COUNT(*) as count FROM clients WHERE status = ?', ['Active'])?.count || 0;
  const activeProjects = queryOne('SELECT COUNT(*) as count FROM projects WHERE status IN (?, ?)', ['New', 'In Progress'])?.count || 0;
  const pendingTasks = queryOne('SELECT COUNT(*) as count FROM tasks WHERE status NOT IN (?, ?)', ['Done', 'Cancelled'])?.count || 0;
  
  const revenueResult = queryOne(`
    SELECT COALESCE(SUM(actual_hours * hourly_rate), 0) as total 
    FROM projects 
    WHERE status = 'Completed'
  `);
  
  return {
    totalClients,
    activeProjects,
    pendingTasks,
    totalRevenue: revenueResult?.total || 0
  };
});

ipcMain.handle('dashboard:getRecentActivity', () => {
  return queryAll('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10');
});

ipcMain.handle('dashboard:getProjectStatusBreakdown', () => {
  return queryAll(`
    SELECT status, COUNT(*) as count 
    FROM projects 
    GROUP BY status
  `);
});

// Export data
ipcMain.handle('export:data', () => {
  const clients = queryAll('SELECT * FROM clients');
  const projects = queryAll('SELECT * FROM projects');
  const tasks = queryAll('SELECT * FROM tasks');
  const activity = queryAll('SELECT * FROM activity_log');
  
  return JSON.stringify({ clients, projects, tasks, activity }, null, 2);
});
