import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MapboxMap from "./pages/MapboxMap";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
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
