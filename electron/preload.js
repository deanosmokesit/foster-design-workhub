const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Client operations
  getClients: () => ipcRenderer.invoke('clients:getAll'),
  getClientById: (id) => ipcRenderer.invoke('clients:getById', id),
  createClient: (client) => ipcRenderer.invoke('clients:create', client),
  updateClient: (client) => ipcRenderer.invoke('clients:update', client),
  deleteClient: (id) => ipcRenderer.invoke('clients:delete', id),

  // Project operations
  getProjects: () => ipcRenderer.invoke('projects:getAll'),
  getProjectById: (id) => ipcRenderer.invoke('projects:getById', id),
  getProjectsByClientId: (clientId) => ipcRenderer.invoke('projects:getByClientId', clientId),
  createProject: (project) => ipcRenderer.invoke('projects:create', project),
  updateProject: (project) => ipcRenderer.invoke('projects:update', project),
  deleteProject: (id) => ipcRenderer.invoke('projects:delete', id),

  // Task operations
  getTasks: () => ipcRenderer.invoke('tasks:getAll'),
  getTaskById: (id) => ipcRenderer.invoke('tasks:getById', id),
  getTasksByProjectId: (projectId) => ipcRenderer.invoke('tasks:getByProjectId', projectId),
  createTask: (task) => ipcRenderer.invoke('tasks:create', task),
  updateTask: (task) => ipcRenderer.invoke('tasks:update', task),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),

  // Dashboard operations
  getStats: () => ipcRenderer.invoke('dashboard:getStats'),
  getRecentActivity: () => ipcRenderer.invoke('dashboard:getRecentActivity'),
  getProjectStatusBreakdown: () => ipcRenderer.invoke('dashboard:getProjectStatusBreakdown'),

  // Export operation
  exportData: () => ipcRenderer.invoke('export:data'),
});
