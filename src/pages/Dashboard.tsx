import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Banknote,
  Plus,
  Clock,
  TrendingUp,
  Download,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { DashboardStats, ActivityLog, ProjectStatusCount } from '../types';

const STATUS_COLORS: Record<string, string> = {
  'New': '#60A5FA',
  'In Progress': '#FBBF24',
  'On Hold': '#94A3B8',
  'Completed': '#34D399',
  'Cancelled': '#F87171',
};

const ACTIVITY_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (window.electronAPI) {
        const [statsData, activityData, statusData] = await Promise.all([
          window.electronAPI.getStats(),
          window.electronAPI.getRecentActivity(),
          window.electronAPI.getProjectStatusBreakdown(),
        ]);
        setStats(statsData);
        setActivity(activityData || []);
        setProjectStatus(statusData || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Active Clients', 
      value: stats?.totalClients || 0, 
      icon: Users, 
      color: 'from-blue-400 to-blue-600',
      shadow: 'shadow-blue-500/20',
      bgGradient: 'from-blue-50 to-blue-100/50',
      link: '/clients',
      trend: '+12%'
    },
    { 
      label: 'Active Projects', 
      value: stats?.activeProjects || 0, 
      icon: FolderKanban, 
      color: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/20',
      bgGradient: 'from-amber-50 to-amber-100/50',
      link: '/projects',
      trend: '+8%'
    },
    { 
      label: 'Pending Tasks', 
      value: stats?.pendingTasks || 0, 
      icon: CheckSquare, 
      color: 'from-purple-400 to-violet-600',
      shadow: 'shadow-purple-500/20',
      bgGradient: 'from-purple-50 to-purple-100/50',
      link: '/tasks',
      trend: '-5%'
    },
    { 
      label: 'Total Revenue', 
      value: `£${(stats?.totalRevenue || 0).toLocaleString()}`, 
      icon: Banknote, 
      color: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      bgGradient: 'from-emerald-50 to-emerald-100/50',
      link: '/projects',
      trend: '+23%'
    },
  ];

  return (
    <div className="flex flex-col w-full gap-12">
      {/* Header Row */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your business overview.</p>
        </div>
        <Link
          to="/clients"
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Organisation
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <Link
            key={card.label}
            to={card.link}
            className="stat-card"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.color}`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className="stat-card-change text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                {card.trend}
              </span>
            </div>
            <div>
              <p className="stat-card-label">{card.label}</p>
              <p className="stat-card-value">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Row */}
      <div className="two-column-grid">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="card-title">Project Status</h2>
              <p className="card-subtitle">Overview of all projects</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          {projectStatus.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStatus} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={12} />
                  <YAxis dataKey="status" type="category" stroke="#64748B" fontSize={12} width={80} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {projectStatus.map((entry, index) => (
                      <Bar key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#94A3B8'} dataKey="count" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state h-64">
              <FolderKanban className="empty-state-icon" />
              <p className="empty-state-title">No projects yet</p>
              <p className="empty-state-subtitle">Create your first project to get started</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="card-title">Recent Activity</h2>
              <p className="card-subtitle">Latest updates</p>
            </div>
            <div className="p-3 bg-violet-50 rounded-xl">
              <Activity className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          {activity.length > 0 ? (
            <div className="space-y-1">
              {activity.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 -mx-2">
                  <div 
                    className="w-2 h-2 rounded-full mt-2 shrink-0"
                    style={{ backgroundColor: ACTIVITY_COLORS[index % ACTIVITY_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{item.details}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(item.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state h-48">
              <Clock className="empty-state-icon" />
              <p className="empty-state-title">No recent activity</p>
              <p className="empty-state-subtitle">Activity will appear here as you work</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link to="/projects" className="action-card">
          <div className="p-4 bg-amber-50 rounded-xl action-card-icon">
            <FolderKanban className="w-6 h-6 text-amber-500" />
          </div>
          <div className="action-card-content">
            <h3>New Project</h3>
            <p>Start a new project</p>
          </div>
        </Link>
        <Link to="/tasks" className="action-card">
          <div className="p-4 bg-purple-50 rounded-xl action-card-icon">
            <CheckSquare className="w-6 h-6 text-purple-500" />
          </div>
          <div className="action-card-content">
            <h3>New Task</h3>
            <p>Create a new task</p>
          </div>
        </Link>
        <Link to="/settings" className="action-card">
          <div className="p-4 bg-emerald-50 rounded-xl action-card-icon">
            <Download className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="action-card-content">
            <h3>Export Data</h3>
            <p>Backup your data</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
