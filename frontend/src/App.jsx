import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MapboxMap from "./pages/MapboxMap";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import AdminDashboardLayout from "./components/layouts/AdminDashboardLayout";
import NGODashboardLayout from "./components/layouts/NGODashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NGODashboard from "./pages/ngo/NGODashboard";
import NGOValidations from "./pages/ngo/NGOValidations";
import NGOCommunity from "./pages/ngo/NGOCommunity";
import IncidentManagement from "./pages/dashboard/IncidentManagement";
import DashboardMap from "./pages/dashboard/DashboardMap";
import { authAPI } from "./utils/api";

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles = [] }) {
  const isAuthenticated = authAPI.isAuthenticated();
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (allowedRoles.length > 0) {
    const user = authAPI.getCurrentUser();
    if (!allowedRoles.includes(user?.role)) {
      return <Navigate to="/mapbox" />;
    }
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin Dashboard Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="map" element={<DashboardMap />} />
          <Route path="incidents" element={<IncidentManagement />} />
        </Route>

        {/* NGO Dashboard Routes */}
        <Route 
          path="/ngo" 
          element={
            <ProtectedRoute allowedRoles={['ngo']}>
              <NGODashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/ngo/dashboard" />} />
          <Route path="dashboard" element={<NGODashboard />} />
          <Route path="map" element={<DashboardMap />} />
          <Route path="incidents" element={<IncidentManagement />} />
          <Route path="validations" element={<NGOValidations />} />
          <Route path="community" element={<NGOCommunity />} />
        </Route>

        {/* Public Map */}
        <Route 
          path="/mapbox" 
          element={
            <ProtectedRoute>
              <MapboxMap />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect /dashboard to appropriate dashboard based on role */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/" element={<Navigate to="/mapbox" />} />
      </Routes>
    </Router>
  );
}

// Helper component to redirect to appropriate dashboard
function DashboardRedirect() {
  const user = authAPI.getCurrentUser();
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" />;
  if (user?.role === 'ngo') return <Navigate to="/ngo/dashboard" />;
  return <Navigate to="/mapbox" />;
}

export default App;
