import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Settings,
  Circle
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Organisations', path: '/clients', icon: Users },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 overflow-hidden">
      <aside className="sidebar w-64 h-full flex flex-col">
        <div className="px-8 py-8 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-xl">DH</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">DevHub</h1>
              <p className="text-sm text-slate-500 font-medium">Work Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 py-8 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item flex items-center gap-4 px-6 py-3.5 rounded-xl font-medium text-base transition-all duration-200 ease-out ${isActive ? 'active bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-6 pb-6 border-t border-slate-200/60 pt-6">
          <div className="flex items-center gap-2 px-4">
            <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">All systems operational</span>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">version 1.0.0</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="header px-8 lg:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {navigation.find(item => item.path === location.pathname)?.name || 'DevHub'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">Work Manager</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
              DH
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 lg:p-12">
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
