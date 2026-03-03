import { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  FolderKanban,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import type { Project, Client } from '../types';

const SERVICE_TYPES = [
  'AI',
  'Automation',
  'IT Infrastructure',
  'Microsoft Products',
  'IT Consultancy',
  'Website Design',
  'Software Development',
];

const STATUS_OPTIONS = ['New', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_BADGE_MAP: Record<string, string> = {
  'New': 'badge badge-info',
  'In Progress': 'badge badge-warning',
  'On Hold': 'badge badge-default',
  'Completed': 'badge badge-success',
  'Cancelled': 'badge badge-default',
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    client_id: number;
    service_type: string;
    status: string;
    priority: string;
    start_date: string;
    due_date: string;
    estimated_hours: string;
    actual_hours: string;
    hourly_rate: string;
    total_budget: string;
    description: string;
    notes: string;
  }>({
    name: '',
    client_id: 0,
    service_type: '',
    status: 'New',
    priority: 'Medium',
    start_date: '',
    due_date: '',
    estimated_hours: '',
    actual_hours: '',
    hourly_rate: '',
    total_budget: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, clientsData] = await Promise.all([
        window.electronAPI.getProjects(),
        window.electronAPI.getClients(),
      ]);
      setProjects(projectsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const projectData = {
        ...formData,
        client_id: Number(formData.client_id),
        status: formData.status as 'New' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled',
        priority: formData.priority as 'Low' | 'Medium' | 'High' | 'Urgent',
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined,
        actual_hours: formData.actual_hours ? Number(formData.actual_hours) : undefined,
        hourly_rate: formData.hourly_rate ? Number(formData.hourly_rate) : undefined,
        total_budget: formData.total_budget ? Number(formData.total_budget) : undefined,
      };
      
      if (editingProject) {
        await window.electronAPI.updateProject({ ...projectData, id: editingProject.id });
      } else {
        await window.electronAPI.createProject(projectData);
      }
      setShowModal(false);
      setEditingProject(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.deleteProject(id);
      setShowDeleteConfirm(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      client_id: project.client_id,
      service_type: project.service_type,
      status: project.status,
      priority: project.priority,
      start_date: project.start_date || '',
      due_date: project.due_date || '',
      estimated_hours: project.estimated_hours?.toString() || '',
      actual_hours: project.actual_hours?.toString() || '',
      hourly_rate: project.hourly_rate?.toString() || '',
      total_budget: project.total_budget?.toString() || '',
      description: project.description || '',
      notes: project.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      client_id: 0,
      service_type: '',
      status: 'New',
      priority: 'Medium',
      start_date: '',
      due_date: '',
      estimated_hours: '',
      actual_hours: '',
      hourly_rate: '',
      total_budget: '',
      description: '',
      notes: '',
    });
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center" style={{ height: '40vh' }}>
          <div className="relative">
            <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">Manage your client projects</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingProject(null);
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        <div className="filter-bar">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="content-section">
            {filteredProjects.map((project) => {
              const statusBadge = STATUS_BADGE_MAP[project.status] || 'badge badge-default';
              
              return (
                <div key={project.id} className="list-item-card">
                  <div className="list-item-avatar">
                    <FolderKanban className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-header">
                      <span className="list-item-title">{project.name}</span>
                      <span className={statusBadge}>{project.status}</span>
                      <span className="badge badge-info">{project.priority}</span>
                    </div>
                    <div className="list-item-meta">
                      <div className="list-item-meta-row">
                        <span>{project.client_name}</span>
                        <span>•</span>
                        <span>{project.service_type}</span>
                      </div>
                      <div className="list-item-meta-row">
                        {project.due_date && (
                          <>
                            <Calendar className="w-4 h-4" />
                            <span>Due {format(new Date(project.due_date), 'MMM d, yyyy')}</span>
                          </>
                        )}
                        {project.estimated_hours && (
                          <>
                            <Clock className="w-4 h-4" />
                            <span>{project.actual_hours || 0}/{project.estimated_hours}h</span>
                          </>
                        )}
                        {project.total_budget && (
                          <>
                            <DollarSign className="w-4 h-4" />
                            <span>£{project.total_budget.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button
                      onClick={() => openEditModal(project)}
                      className="icon-button"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(project.id!)}
                      className="icon-button"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="content-section">
            <div className="empty-state">
              <FolderKanban className="w-12 h-12" />
              <p>No projects found</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Create your first project
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-6">
          <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
              <h2 className="text-2xl font-semibold text-slate-900">
                {editingProject ? 'Edit Project' : 'New Project'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProject(null);
                  resetForm();
                }}
                className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Organisation *
                  </label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: Number(e.target.value) })}
                    className="input"
                  >
                    <option value={0}>Select an organisation</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Service Type *
                  </label>
                  <select
                    required
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="input"
                  >
                    <option value="">Select service type</option>
                    {SERVICE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="input"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Actual Hours
                  </label>
                  <input
                    type="number"
                    value={formData.actual_hours}
                    onChange={(e) => setFormData({ ...formData, actual_hours: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Hourly Rate (£)
                  </label>
                  <input
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Total Budget (£)
                  </label>
                  <input
                    type="number"
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-slate-600 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="input resize-none"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-slate-600 mb-3">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="input resize-none"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-6">
            <div className="modal-content p-10 w-full max-w-md">
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Delete Project</h3>
              <p className="text-base text-slate-500 mb-8">
                Are you sure you want to delete this project? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="btn text-white bg-red-500 hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
