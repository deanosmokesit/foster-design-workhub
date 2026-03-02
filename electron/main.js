const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let mainWindow;
let db;

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

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'foster-design.db');
  console.log('Database path:', dbPath);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
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
    );

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
    );

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
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized');
}

app.whenReady().then(() => {
  initDatabase();
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
  return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
});

ipcMain.handle('clients:getById', (event, id) => {
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
});

ipcMain.handle('clients:create', (event, client) => {
  const stmt = db.prepare(`
    INSERT INTO clients (company_name, contact_name, email, phone, address, website, industry, status, service_categories, notes, last_contact_at)
    VALUES (@company_name, @contact_name, @email, @phone, @address, @website, @industry, @status, @service_categories, @notes, @last_contact_at)
  `);
  const result = stmt.run(client);
  
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)')
    .run('client', result.lastInsertRowid, 'created', `Created client: ${client.company_name}`);
  
  return { id: result.lastInsertRowid, ...client };
});

ipcMain.handle('clients:update', (event, client) => {
  const stmt = db.prepare(`
    UPDATE clients SET
      company_name = @company_name,
      contact_name = @contact_name,
      email = @email,
      phone = @phone,
      address = @address,
      website = @website,
      industry = @industry,
      status = @status,
      service_categories = @service_categories,
      notes = @notes,
      last_contact_at = @last_contact_at
    WHERE id = @id
  `);
  stmt.run(client);
  
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)')
    .run('client', client.id, 'updated', `Updated client: ${client.company_name}`);
  
  return client;
});

ipcMain.handle('clients:delete', (event, id) => {
  const client = db.prepare('SELECT company_name FROM clients WHERE id = ?').get(id);
  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)')
    .run('client', id, 'deleted', `Deleted client: ${client?.company_name}`);
  
  return { success: true };
});

// IPC Handlers for Projects
ipcMain.handle('projects:getAll', () => {
  return db.prepare(`
    SELECT p.*, c.company_name as client_name 
    FROM projects p 
    LEFT JOIN clients c ON p.client_id = c.id 
    ORDER BY p.created_at DESC
  `).all();
});

ipcMain.handle('projects:getById', (event, id) => {
  return db.prepare(`
    SELECT p.*, c.company_name as client_name 
    FROM projects p 
    LEFT JOIN clients c ON p.client_id = c.id 
    WHERE p.id = ?
  `).get(id);
});

ipcMain.handle('projects:getByClientId', (event, clientId) => {
  return db.prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
});

ipcMain.handle('projects:create', (event, project) => {
  const stmt = db.prepare(`
    INSERT INTO projects (name, client_id, service_type, status, priority, start_date, due_date, estimated_hours, actual_hours, hourly_rate, total_budget, description, notes)
    VALUES (@name, @client_id, @service_type, @status, @priority, @start_date, @due_date, @estimated_hours, @actual_hours, @hourly_rate, @total_budget, @description, @notes)
  `);
  const result = stmt.run(project);
  
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)')
    .run('project', result.lastInsertRowid, 'created', `Created project: ${project.name}`);
  
  return { id: result.lastInsertRowid, ...project };
});

ipcMain.handle('projects:update', (event, project) => {
  const stmt = db.prepare(`
    UPDATE projects SET
      name = @name,
      client_id = @client_id,
      service_type = @service_type,
      status = @status,
      priority = @priority,
      start_date = @start_date,
      due_date = @due_date,
      estimated_hours = @estimated_hours,
      actual_hours = @actual_hours,
      hourly_rate = @hourly_rate,
      total_budget = @total_budget,
      description = @description,
      notes = @notes,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);
  stmt.run(project);
  
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)')
    .run('project', project.id, 'updated', `Updated project: ${project.name}`);
  
  return project;
});

ipcMain.handle('projects:delete', (event, id) => {
  const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)')
    .run('project', id, 'deleted', `Deleted project: ${project?.name}`);
  
  return { success: true };
});

// IPC Handlers for Tasks
ipcMain.handle('tasks:getAll', () => {
  return db.prepare(`
    SELECT t.*, p.name as project_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    ORDER BY t.created_at DESC
  `).all();
});

ipcMain.handle('tasks:getById', (event, id) => {
  return db.prepare(`
    SELECT t.*, p.name as project_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    WHERE t.id = ?
  `).get(id);
});

ipcMain.handle('tasks:getByProjectId', (event, projectId) => {
  return db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
});

ipcMain.handle('tasks:create', (event, task) => {
  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, project_id, status, priority, due_date, estimated_hours, assigned_to, tags)
    VALUES (@title, @description, @project_id, @status, @priority, @due_date, @estimated_hours, @assigned_to, @tags)
  `);
  const result = stmt.run(task);
  
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)')
    .run('task', result.lastInsertRowid, 'created', `Created task: ${task.title}`);
  
  return { id: result.lastInsertRowid, ...task };
});

ipcMain.handle('tasks:update', (event, task) => {
  const stmt = db.prepare(`
    UPDATE tasks SET
      title = @title,
      description = @description,
      project_id = @project_id,
      status = @status,
      priority = @priority,
      due_date = @due_date,
      estimated_hours = @estimated_hours,
      assigned_to = @assigned_to,
      tags = @tags,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);
  stmt.run(task);
  
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)')
    .run('task', task.id, 'updated', `Updated task: ${task.title}`);
  
  return task;
});

ipcMain.handle('tasks:delete', (event, id) => {
  const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES (?, ?, ?, ?)')
    .run('task', id, 'deleted', `Deleted task: ${task?.title}`);
  
  return { success: true };
});

// IPC Handlers for Dashboard Stats
ipcMain.handle('dashboard:getStats', () => {
  const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients WHERE status = ?').get('Active').count;
  const activeProjects = db.prepare('SELECT COUNT(*) as count FROM projects WHERE status IN (?, ?)').get('New', 'In Progress').count;
  const pendingTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status NOT IN (?, ?)').get('Done', 'Cancelled').count;
  
  const revenueResult = db.prepare(`
    SELECT COALESCE(SUM(actual_hours * hourly_rate), 0) as total 
    FROM projects 
    WHERE status = 'Completed'
  `).get();
  
  return {
    totalClients,
    activeProjects,
    pendingTasks,
    totalRevenue: revenueResult.total
  };
});

ipcMain.handle('dashboard:getRecentActivity', () => {
  return db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10').all();
});

ipcMain.handle('dashboard:getProjectStatusBreakdown', () => {
  return db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM projects 
    GROUP BY status
  `).all();
});

// Export data
ipcMain.handle('export:data', () => {
  const clients = db.prepare('SELECT * FROM clients').all();
  const projects = db.prepare('SELECT * FROM projects').all();
  const tasks = db.prepare('SELECT * FROM tasks').all();
  const activity = db.prepare('SELECT * FROM activity_log').all();
  
  return JSON.stringify({ clients, projects, tasks, activity }, null, 2);
});
