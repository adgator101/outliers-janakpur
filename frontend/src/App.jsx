import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapboxMap from "./pages/MapboxMap";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mapbox" element={<MapboxMap />} />
      </Routes>
    </Router>
  );
}

export default App;
