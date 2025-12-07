import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Map, AlertTriangle, LogOut, Menu, X, Shield } from 'lucide-react';
import { authAPI } from '../../utils/api';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = authAPI.getCurrentUser();
  const role = user?.role || 'user';

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Overview', icon: <BarChart3 className="h-5 w-5" /> },
    { path: '/dashboard/map', label: 'Map View', icon: <Map className="h-5 w-5" /> },
    { path: '/dashboard/incidents', label: 'Incidents', icon: <AlertTriangle className="h-5 w-5" /> },
  ];

  if (role === 'admin') {
    menuItems.push(
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className={`bg-slate-800 text-gray-300 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'} flex flex-col shadow-2xl z-20 border-r border-slate-700`}>
        <div className="h-18 flex items-center justify-between px-6 bg-indigo-600 border-b border-indigo-500/30">
          {sidebarOpen && (
              <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white shadow-lg ring-2 ring-white/30">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-white tracking-wide">SafeMap</span>
                    <p className="text-xs text-indigo-100 font-medium">Admin Portal</p>
                  </div>
              </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all shadow-sm hover:shadow-md backdrop-blur-sm"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/') 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105' 
                : 'hover:bg-slate-700/70 hover:text-white hover:shadow-md hover:scale-102'
              }`}
            >
              <div className="group-hover:scale-110 transition-transform flex-shrink-0">{item.icon}</div>
              {sidebarOpen && <span className="font-semibold text-sm truncate">{item.label}</span>}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-700 bg-slate-850">
          <div className="flex items-center space-x-4 mb-4 px-3 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-indigo-400/30">
                {user?.email?.[0].toUpperCase()}
            </div>
            {sidebarOpen && (
                <div className="overflow-hidden flex-1">
                    <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                    <p className="text-xs text-indigo-300 uppercase tracking-wider font-medium flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                      {role}
                    </p>
                </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-lg transform hover:scale-105 group"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="font-semibold text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/80 h-18 flex items-center px-20 sticky top-0 z-10 w-full shadow-sm">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full uppercase tracking-wide">
                {role}
              </span>
            </div>
        </header>
        <main className="flex-1 px-20 py-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
