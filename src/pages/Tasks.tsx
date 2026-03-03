import { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  CheckSquare,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, Project } from '../types';

const STATUS_OPTIONS = ['Todo', 'In Progress', 'Review', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; bgFill?: string }> = {
  'Todo': { bg: 'bg-slate-100 text-slate-600', text: 'text-slate-600', border: 'border-slate-300' },
  'In Progress': { bg: 'bg-blue-100 text-blue-700', text: 'text-blue-700', border: 'border-blue-500', bgFill: 'bg-blue-50' },
  'Review': { bg: 'bg-amber-100 text-amber-700', text: 'text-amber-700', border: 'border-amber-500', bgFill: 'bg-amber-50' },
  'Done': { bg: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-500', bgFill: 'bg-emerald-50' },
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Low': { bg: 'bg-slate-100 text-slate-600', text: 'text-slate-600', dot: 'bg-slate-400' },
  'Medium': { bg: 'bg-blue-100 text-blue-700', text: 'text-blue-700', dot: 'bg-blue-500' },
  'High': { bg: 'bg-orange-100 text-orange-700', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Urgent': { bg: 'bg-red-100 text-red-700', text: 'text-red-700', dot: 'bg-red-500' },
};

const BADGE_MAP: Record<string, string> = {
  'Todo': 'badge badge-info',
  'In Progress': 'badge badge-warning',
  'Review': 'badge badge-warning',
  'Done': 'badge badge-success',
  'Cancelled': 'badge badge-default',
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    project_id: number;
    status: string;
    priority: string;
    due_date: string;
    estimated_hours: string;
    assigned_to: string;
    tags: string;
  }>({
    title: '',
    description: '',
    project_id: 0,
    status: 'Todo',
    priority: 'Medium',
    due_date: '',
    estimated_hours: '',
    assigned_to: '',
    tags: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, projectsData] = await Promise.all([
        window.electronAPI.getTasks(),
        window.electronAPI.getProjects(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        project_id: formData.project_id || undefined,
        status: formData.status as 'Todo' | 'In Progress' | 'Review' | 'Done',
        priority: formData.priority as 'Low' | 'Medium' | 'High' | 'Urgent',
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined,
      };
      
      if (editingTask) {
        await window.electronAPI.updateTask({ ...taskData, id: editingTask.id });
      } else {
        await window.electronAPI.createTask(taskData);
      }
      setShowModal(false);
      setEditingTask(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.deleteTask(id);
      setShowDeleteConfirm(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await window.electronAPI.updateTask({ ...task, status: newStatus as any });
      loadData();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id || 0,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      estimated_hours: task.estimated_hours?.toString() || '',
      assigned_to: task.assigned_to || '',
      tags: task.tags || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_id: 0,
      status: 'Todo',
      priority: 'Medium',
      due_date: '',
      estimated_hours: '',
      assigned_to: '',
      tags: '',
    });
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Tasks</h1>
            <p className="page-subtitle">Manage your work tasks</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingTask(null);
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>

        <div className="filter-bar">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
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
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priority</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="content-section">
            {filteredTasks.map((task) => {
              const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES['Todo'];
              const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES['Medium'];
              const badgeClass = BADGE_MAP[task.status] || 'badge badge-default';
              
              return (
                <div
                  key={task.id}
                  className="list-item-card"
                >
                  <div 
                    className="list-item-avatar"
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id!)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextStatus = {
                          'Todo': 'In Progress',
                          'In Progress': 'Review',
                          'Review': 'Done',
                          'Done': 'Todo',
                        }[task.status] as string;
                        handleStatusChange(task, nextStatus);
                      }}
                      className={`checkbox ${
                        task.status === 'Done' 
                          ? 'checkbox-checked' 
                          : 'checkbox-unchecked'
                      }`}
                    >
                      {task.status === 'Done' && <CheckSquare className="w-5 h-5" />}
                    </button>
                  </div>
                  <div 
                    className="list-item-content"
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id!)}
                  >
                    <div className="list-item-header">
                      <span className={`list-item-title ${task.status === 'Done' ? 'line-through' : ''}`}>
                        {task.title}
                      </span>
                      <span className={badgeClass}>
                        {task.status}
                      </span>
                      <span className={`badge ${priorityStyle.bg.replace('bg-', 'badge-')}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="list-item-meta">
                      {task.project_name && (
                        <div className="list-item-meta-row">
                          <CheckSquare className="w-4 h-4" />
                          {task.project_name}
                        </div>
                      )}
                      {task.due_date && (
                        <div className="list-item-meta-row">
                          <Calendar className="w-4 h-4" />
                          Due {format(new Date(task.due_date), 'MMM d')}
                        </div>
                      )}
                      {task.estimated_hours && (
                        <div className="list-item-meta-row">
                          <Clock className="w-4 h-4" />
                          {task.estimated_hours}h
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(task);
                      }}
                      className="icon-button"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(task.id!);
                      }}
                      className="icon-button"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {expandedTask === task.id ? (
                      <ChevronUp className="w-7 h-7 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <CheckSquare className="w-10 h-10" />
            </div>
            <p className="empty-state-title">No tasks found</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn btn-primary"
            >
              Create your first task
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTask(null);
                  resetForm();
                }}
                className="icon-button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="form-textarea"
                  placeholder="Add more details..."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Project
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                    className="form-select"
                  >
                    <option value={0}>No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="form-select"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="form-select"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="form-input"
                    placeholder="Who is responsible?"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="form-input"
                  placeholder="e.g., frontend, bug, urgent"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
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
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <h3 className="modal-title">Delete Task</h3>
            <p className="modal-text">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="btn btn-danger"
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
