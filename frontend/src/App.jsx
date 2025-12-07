import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MapboxMap from "./pages/MapboxMap";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import DashboardLayout from "./components/layouts/DashboardLayout";
import DashboardStats from "./pages/dashboard/DashboardStats";
import DashboardMap from "./pages/dashboard/DashboardMap";
import IncidentManagement from "./pages/dashboard/IncidentManagement";
import { authAPI } from "./utils/api";

// Protected Route wrapper
function ProtectedRoute({ children }) {
  return authAPI.isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard Routes - Protected */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
            <Route index element={<DashboardStats />} />
            <Route path="map" element={<DashboardMap />} />
            <Route path="incidents" element={<IncidentManagement />} />
        </Route>

        <Route 
          path="/mapbox" 
          element={
            <ProtectedRoute>
              <MapboxMap />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/mapbox" />} />
      </Routes>
    </Router>
  );
}

export default App;
