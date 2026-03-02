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
      <div className="flex items-center justify-center h-80">
        <div className="relative">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
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

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="search-bar flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar-input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-dropdown"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="filter-dropdown"
        >
          <option value="all">All Priority</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </div>

      {filteredTasks.length > 0 ? (
        <div className="space-y-8">
          {filteredTasks.map((task) => {
            const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES['Todo'];
            const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES['Medium'];
            
            return (
              <div
                key={task.id}
                className={`glass-card ${statusStyle.bgFill || ''}`}
              >
                <div 
                  className="flex items-start gap-8 p-8 cursor-pointer"
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
                    className={`mt-2 w-8 h-8 rounded-2xl border-[3px] flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      task.status === 'Done' 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {task.status === 'Done' && <CheckSquare className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h3 className={`text-xl font-semibold text-slate-900 ${task.status === 'Done' ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </h3>
                      <span className={`px-5 py-2 rounded-2xl text-base font-medium ${statusStyle.bg}`}>
                        {task.status}
                      </span>
                      <span className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-base font-medium ${priorityStyle.bg}`}>
                        <span className="w-2.5 h-2.5 rounded-full bg-current" />
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-6 mt-5 text-base text-slate-500">
                      {task.project_name && (
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4" />
                          {task.project_name}
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Due {format(new Date(task.due_date), 'MMM d')}
                        </div>
                      )}
                      {task.estimated_hours && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {task.estimated_hours}h
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(task);
                      }}
                      className="p-4 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(task.id!);
                      }}
                      className="p-4 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
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
                
                {expandedTask === task.id && (
                  <div className="px-8 pb-8 pt-0 pl-[5.5rem]">
                    {task.description && (
                      <p className="text-lg text-slate-600 mb-8 pb-8 border-b border-slate-200/50">{task.description}</p>
                    )}
                    {task.tags && (
                      <div className="flex flex-wrap gap-4 mb-8">
                        {JSON.parse(task.tags || '[]').map((tag: string) => (
                          <span key={tag} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-base font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-10 text-base text-slate-400">
                      <span>Created {format(new Date(task.created_at || ''), 'MMM d, yyyy')}</span>
                      {task.assigned_to && <span>Assigned to: {task.assigned_to}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckSquare className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-xl text-slate-500">No tasks found</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="mt-6 text-blue-500 hover:text-blue-600 text-lg font-medium"
          >
            Create your first task
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-6">
          <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
              <h2 className="text-2xl font-semibold text-slate-900">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTask(null);
                  resetForm();
                }}
                className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div>
                <label className="block text-base font-medium text-slate-600 mb-3">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="What needs to be done?"
                />
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
                  placeholder="Add more details..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Project
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                    className="input"
                  >
                    <option value={0}>No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
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
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="input"
                    placeholder="Who is responsible?"
                  />
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-slate-600 mb-3">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="input"
                  placeholder="e.g., frontend, bug, urgent"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
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
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-6">
          <div className="modal-content p-10 w-full max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Delete Task</h3>
            <p className="text-base text-slate-500 mb-8">
              Are you sure you want to delete this task? This action cannot be undone.
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
