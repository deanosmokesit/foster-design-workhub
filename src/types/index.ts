export interface Client {
  id?: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  status: 'Active' | 'Inactive' | 'Prospect';
  service_categories?: string;
  notes?: string;
  created_at?: string;
  last_contact_at?: string;
}

export interface Project {
  id?: number;
  name: string;
  client_id: number;
  client_name?: string;
  service_type: string;
  status: 'New' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  hourly_rate?: number;
  total_budget?: number;
  description?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  project_id?: number;
  project_name?: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  due_date?: string;
  estimated_hours?: number;
  assigned_to?: string;
  tags?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  details?: string;
  created_at: string;
}

export interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  pendingTasks: number;
  totalRevenue: number;
}

export interface ProjectStatusCount {
  status: string;
  count: number;
}

declare global {
  interface Window {
    electronAPI: {
      getClients: () => Promise<Client[]>;
      getClientById: (id: number) => Promise<Client | null>;
      createClient: (client: Omit<Client, 'id' | 'created_at'>) => Promise<Client>;
      updateClient: (client: Client) => Promise<Client>;
      deleteClient: (id: number) => Promise<{ success: boolean }>;

      getProjects: () => Promise<Project[]>;
      getProjectById: (id: number) => Promise<Project | null>;
      getProjectsByClientId: (clientId: number) => Promise<Project[]>;
      createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<Project>;
      updateProject: (project: Project) => Promise<Project>;
      deleteProject: (id: number) => Promise<{ success: boolean }>;

      getTasks: () => Promise<Task[]>;
      getTaskById: (id: number) => Promise<Task | null>;
      getTasksByProjectId: (projectId: number) => Promise<Task[]>;
      createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
      updateTask: (task: Task) => Promise<Task>;
      deleteTask: (id: number) => Promise<{ success: boolean }>;

      getStats: () => Promise<DashboardStats>;
      getRecentActivity: () => Promise<ActivityLog[]>;
      getProjectStatusBreakdown: () => Promise<ProjectStatusCount[]>;

      exportData: () => Promise<string>;
    };
  }
}
