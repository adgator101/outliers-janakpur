import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Map, 
  AlertTriangle, 
  LogOut, 
  Menu, 
  X, 
  Shield,
  Users,
  TrendingUp,
  Settings,
  Database
} from 'lucide-react';
import { authAPI } from '../../utils/api';

export default function AdminDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = authAPI.getCurrentUser();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
    { path: '/admin/map', label: 'Map View', icon: <Map className="h-5 w-5" /> },
    { path: '/admin/incidents', label: 'Incidents', icon: <AlertTriangle className="h-5 w-5" /> },
    { path: '/admin/trends', label: 'Trends', icon: <TrendingUp className="h-5 w-5" /> },
    { path: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { path: '/admin/data', label: 'Data Export', icon: <Database className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">SafeMap</span>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3 px-2 py-2 rounded-lg bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white text-sm">
              {user?.email?.[0].toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 uppercase">Administrator</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors group"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto px-20 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
