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
  ArrowDownRight,
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
      <div className="page-container">
        <div className="flex items-center justify-center" style={{ height: '60vh' }}>
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Active Clients', 
      value: stats?.totalClients || 0, 
      icon: Users, 
      color: '#3B82F6',
      link: '/clients',
      trend: '+12%',
      positive: true
    },
    { 
      label: 'Active Projects', 
      value: stats?.activeProjects || 0, 
      icon: FolderKanban, 
      color: '#F59E0B',
      link: '/projects',
      trend: '+8%',
      positive: true
    },
    { 
      label: 'Pending Tasks', 
      value: stats?.pendingTasks || 0, 
      icon: CheckSquare, 
      color: '#8B5CF6',
      link: '/tasks',
      trend: '-5%',
      positive: false
    },
    { 
      label: 'Total Revenue', 
      value: `£${(stats?.totalRevenue || 0).toLocaleString()}`, 
      icon: Banknote, 
      color: '#10B981',
      link: '/projects',
      trend: '+23%',
      positive: true
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your business overview.</p>
        </div>
        <Link to="/clients" className="btn btn-primary">
          <Plus className="btn-icon" />
          Add Organisation
        </Link>
      </div>

      {/* Stats Row */}
      <div className="content-section">
        <div className="stats-grid">
          {statCards.map((card) => (
            <Link key={card.label} to={card.link} className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon-wrapper" style={{ background: card.color }}>
                  <card.icon className="stat-card-icon" />
                </div>
                <span className={`stat-card-change ${card.positive ? 'positive' : 'negative'}`}>
                  {card.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {card.trend}
                </span>
              </div>
              <p className="stat-card-label">{card.label}</p>
              <p className="stat-card-value">{card.value}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Row */}
      <div className="content-section">
        <div className="two-col-grid">
          {/* Project Status Card */}
          <div className="content-card-main">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="card-title">Project Status</h2>
                <p className="card-subtitle">Overview of all projects</p>
              </div>
              <div className="stat-card-icon-wrapper" style={{ background: '#3B82F6' }}>
                <TrendingUp className="stat-card-icon" />
              </div>
            </div>
            {projectStatus.length > 0 ? (
              <div style={{ height: 256 }}>
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
              <div className="empty-state" style={{ height: 256 }}>
                <FolderKanban className="empty-state-icon" />
                <p className="empty-state-title">No projects yet</p>
                <p className="empty-state-description">Create your first project to get started</p>
              </div>
            )}
          </div>

          {/* Recent Activity Card */}
          <div className="content-card-side">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="card-title">Recent Activity</h2>
                <p className="card-subtitle">Latest updates</p>
              </div>
              <div className="stat-card-icon-wrapper" style={{ background: '#8B5CF6' }}>
                <Activity className="stat-card-icon" />
              </div>
            </div>
            {activity.length > 0 ? (
              <div>
                {activity.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3" style={{ padding: '12px 0', borderBottom: index < 4 ? '1px solid #E5E7EB' : 'none' }}>
                    <div 
                      style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: ACTIVITY_COLORS[index % ACTIVITY_COLORS.length],
                        marginTop: 6,
                        flexShrink: 0 
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-sm" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.details}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF', marginTop: 4 }}>
                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ height: 200 }}>
                <Clock className="empty-state-icon" />
                <p className="empty-state-title">No recent activity</p>
                <p className="empty-state-description">Activity will appear here as you work</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Cards Row */}
      <div className="content-section">
        <div className="action-cards-grid">
          <Link to="/projects" className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FolderKanban size={24} color="#D97706" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>New Project</p>
              <p style={{ fontSize: 14, color: '#6B7280' }}>Start a new project</p>
            </div>
          </Link>
          <Link to="/tasks" className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckSquare size={24} color="#7C3AED" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>New Task</p>
              <p style={{ fontSize: 14, color: '#6B7280' }}>Create a new task</p>
            </div>
          </Link>
          <Link to="/settings" className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Download size={24} color="#059669" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Export Data</p>
              <p style={{ fontSize: 14, color: '#6B7280' }}>Backup your data</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
