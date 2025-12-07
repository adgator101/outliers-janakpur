import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
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
    { path: '/dashboard', label: 'Overview', icon: '📊' },
    { path: '/dashboard/map', label: 'Map View', icon: '🗺️' },
    { path: '/dashboard/incidents', label: 'Incidents', icon: '⚠️' },
  ];

  if (role === 'admin') {
      // Add admin specific links if any
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className={`bg-[#0f172a] text-gray-300 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col shadow-xl z-20`}>
        <div className="h-16 flex items-center justify-between px-4 bg-[#0f172a] border-b border-gray-800">
          {sidebarOpen && (
              <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
                  <span className="text-lg font-bold text-white tracking-wide">SafeMap</span>
              </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/') 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
              {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-[#0f172a]">
          <div className="flex items-center space-x-3 mb-2 px-2 py-2 rounded-lg bg-gray-900/50 border border-gray-800">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-inner">
                {user?.email?.[0].toUpperCase()}
            </div>
            {sidebarOpen && (
                <div className="overflow-hidden">
                    <p className="text-xs font-medium text-white truncate">{user?.email}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{role}</p>
                </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors mt-2"
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center px-8 sticky top-0 z-10 w-full">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
        </header>
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
