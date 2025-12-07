import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import IncidentDetailsPanel from "../components/IncidentDetailsPanel";
import { incidentAPI, authAPI } from "../utils/api";
import IncidentReportForm from "../components/IncidentReportForm";


mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapboxMap() {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const [currentFeature, setCurrentFeature] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [incidents, setIncidents] = useState([]);

  const issueTypes = [
    { value: "gbv", label: "GBV Incident", color: "#ff4444" },
    { value: "unsafe_area", label: "Unsafe Area", color: "#ff8800" },
    { value: "no_lights", label: "No Street Lights", color: "#8800ff" },
    { value: "other", label: "Other Safety Concern", color: "#4444ff" },
  ];

  // Load incidents from backend
  const loadIncidents = async () => {
    try {
      const data = await incidentAPI.getAll();
      setIncidents(data.incidents);
      return data.incidents;
    } catch (error) {
      console.error("Error loading incidents:", error);
      return [];
    }
  };

  // Render incidents on map
  const renderIncidentsOnMap = (incidentsList) => {
    if (!map.current) return;

    incidentsList.forEach((incident) => {
      const sourceId = `incident-${incident.id}`;
      const layerId = `incident-layer-${incident.id}`;

      // Skip if source already exists
      if (map.current.getSource(sourceId)) return;

      const color =
        issueTypes.find((t) => t.value === incident.incident_type)?.color ||
        "#999999";

      map.current.addSource(sourceId, {
        type: "geojson",
        data: incident.coordinates,
      });

      // Add fill layer
      map.current.addLayer({
        id: `${layerId}-fill`,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": color,
          "fill-opacity": 0.3,
        },
      });

      // Add outline layer
      map.current.addLayer({
        id: `${layerId}-outline`,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": color,
          "line-width": 2,
        },
      });

      // Add click event to show details
      map.current.on("click", `${layerId}-fill`, () => {
        setSelectedIncidentId(incident.id);
      });

      // Change cursor on hover
      map.current.on("mouseenter", `${layerId}-fill`, () => {
        map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", `${layerId}-fill`, () => {
        map.current.getCanvas().style.cursor = "";
      });
    });
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  useEffect(() => {
    if (map.current) return; // Initialize map only once
    if (!mapContainer.current) return; // Make sure container exists

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12", // Use default style first
        center: [87.2718, 26.6637], // Itahari, Nepal
        zoom: 13,
      });

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl());

      // Add marker for Itahari
      new mapboxgl.Marker()
        .setLngLat([87.2718, 26.6637])
        .setPopup(new mapboxgl.Popup().setHTML("<h3>Itahari, Nepal</h3>"))
        .addTo(map.current);

      // Add draw controls after map loads
      map.current.on("load", async () => {
        draw.current = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            point: true,
            trash: true,
          },
        });

        map.current.addControl(draw.current);

        // Load and render incidents from backend
        const loadedIncidents = await loadIncidents();
        renderIncidentsOnMap(loadedIncidents);

        // Listen for draw events
        map.current.on("draw.create", (e) => {
          console.log("Draw create event triggered", e.features[0]);
          setCurrentFeature(e.features[0]);
          setShowReportForm(true);
        });

        map.current.on("draw.delete", () => {
          // Features deleted, could add cleanup logic here
        });
      });
    } catch (error) {
      console.error("Error initializing Mapbox map:", error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleReportSuccess = async () => {
    // Clear the drawn feature
    if (currentFeature && draw.current) {
      draw.current.delete(currentFeature.id);
    }

    // Reload incidents
    const loadedIncidents = await loadIncidents();

    // Clear existing incident layers
    incidents.forEach((incident) => {
      const layerId = `incident-layer-${incident.id}`;
      try {
        if (map.current.getLayer(`${layerId}-fill`)) {
          map.current.removeLayer(`${layerId}-fill`);
        }
        if (map.current.getLayer(`${layerId}-outline`)) {
          map.current.removeLayer(`${layerId}-outline`);
        }
        if (map.current.getSource(`incident-${incident.id}`)) {
          map.current.removeSource(`incident-${incident.id}`);
        }
      } catch (e) {
        console.error("Error removing layer:", e);
      }
    });

    // Render updated incidents
    renderIncidentsOnMap(loadedIncidents);
  };

  const handleFormClose = () => {
    // Remove the drawn feature if form is closed without submitting
    if (currentFeature && draw.current) {
      draw.current.delete(currentFeature.id);
    }
    setShowReportForm(false);
    setCurrentFeature(null);
  };

  const handleDetailsUpdate = async () => {
    // Reload incidents when comments are added
    await loadIncidents();
  };

  // Check if any sidebar is open to adjust layout if needed (now handled by absolute positioning)
  // const sidebarOpen = showReportForm || selectedIncidentId;

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-gray-50 relative">
      {/* Map Container - Full Screen Background */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full z-0 block"
      />

      {/* Floating Header - Top Center/Split */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex justify-between items-start">
        {/* Branding - Top Left */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-3 border border-gray-200 pointer-events-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div className="pr-2">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">SafeMap</h1>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Janakpur</p>
          </div>
        </div>

        {/* Actions - Top Right */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl px-4 py-2 border border-gray-200">
            <span className="font-bold text-gray-900">{incidents.length}</span>
            <span className="text-sm text-gray-600 ml-1">incidents</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Overlay Area */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Help Info Panel - Bottom Left */}
        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md rounded-xl shadow-lg px-5 py-4 max-w-xs pointer-events-auto border border-gray-200">
          <h3 className="font-bold mb-3 text-gray-900 text-sm flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
            Quick Guide
          </h3>
          <ul className="text-xs space-y-2 text-gray-600">
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-[10px]">1</div>
              <span className="mt-0.5">Use the draw tools to report an incident</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-[10px]">2</div>
              <span className="mt-0.5">Click any marker to view details & discuss</span>
            </li>
          </ul>
        </div>

        {/* Incident Report Form - Floating Panel (Sidebar) */}
        {showReportForm && currentFeature && (
          <div className="absolute top-24 right-4 bottom-6 w-[400px] shadow-2xl rounded-xl overflow-hidden bg-white border border-gray-200 flex flex-col transition-all duration-300 pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-200">
            <IncidentReportForm
              coordinates={currentFeature.geometry}
              areaType={currentFeature.geometry.type}
              onClose={handleFormClose}
              onSuccess={handleReportSuccess}
            />
          </div>
        )}

        {/* Incident Details Panel - Floating Panel (Sidebar) */}
        {selectedIncidentId && (
          <div className="absolute top-24 right-4 bottom-6 w-[400px] shadow-2xl rounded-xl overflow-hidden bg-white border border-gray-200 flex flex-col transition-all duration-300 pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-200">
            <IncidentDetailsPanel
              incidentId={selectedIncidentId}
              onClose={() => setSelectedIncidentId(null)}
              onUpdate={handleDetailsUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MapboxMap;
