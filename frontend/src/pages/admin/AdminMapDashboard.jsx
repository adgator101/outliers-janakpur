import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { regionAPI, authAPI, incidentAPI } from "../../utils/api";
import IncidentDetailsPanel from "../../components/IncidentDetailsPanel";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Users,
  Activity,
  Settings,
  LogOut,
  Filter,
  Search,
  RefreshCw,
  Eye
} from "lucide-react";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function AdminMapDashboard() {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionIncidents, setRegionIncidents] = useState([]);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    timeRange: '30d'
  });
  const [stats, setStats] = useState({
    totalRegions: 0,
    totalIncidents: 0,
    pendingValidation: 0,
    avgSafetyScore: 0
  });

  const getSafetyColor = (safetyScore) => {
    if (safetyScore >= 7) return "#4ade80";
    if (safetyScore >= 5) return "#fbbf24";
    if (safetyScore >= 3) return "#f97316";
    return "#dc2626";
  };

  const getRiskLevel = (safetyScore) => {
    if (safetyScore >= 7) return "Low";
    if (safetyScore >= 5) return "Medium";
    if (safetyScore >= 3) return "High";
    return "Critical";
  };

  const loadRegions = async () => {
    try {
      const data = await regionAPI.getAll();
      setRegions(data.regions);
      setStats(prev => ({
        ...prev,
        totalRegions: data.regions.length,
        avgSafetyScore: data.regions.reduce((sum, r) => sum + r.safety_score, 0) / data.regions.length || 0
      }));
      return data.regions;
    } catch (error) {
      console.error("Error loading regions:", error);
      return [];
    }
  };

  const loadIncidentStats = async () => {
    try {
      const data = await incidentAPI.getAll();
      const incidents = data.incidents || [];
      setStats(prev => ({
        ...prev,
        totalIncidents: incidents.length,
        pendingValidation: incidents.filter(i => i.status === 'pending').length
      }));
    } catch (error) {
      console.error("Error loading incident stats:", error);
    }
  };

  const loadRegionIncidents = async (regionId) => {
    setLoading(true);
    try {
      const data = await incidentAPI.getAll();
      const incidents = data.incidents || [];
      
      // Filter incidents for the selected region
      // Check multiple possible fields for region association
      const filteredIncidents = incidents.filter(incident => {
        return incident.region_id === regionId || 
               incident.regionId === regionId ||
               incident.region === regionId ||
               // If no region association exists, show all incidents for now
               (!incident.region_id && !incident.regionId && !incident.region);
      });
      
      setRegionIncidents(filteredIncidents);
    } catch (error) {
      console.error("Error loading region incidents:", error);
      setRegionIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const renderRegionsOnMap = (regionsList) => {
    if (!map.current) return;

    regionsList.forEach((region) => {
      const sourceId = `region-${region.id}`;
      const layerId = `region-layer-${region.id}`;

      if (map.current.getSource(sourceId)) return;

      const color = getSafetyColor(region.safety_score);

      map.current.addSource(sourceId, {
        type: "geojson",
        data: region.coordinates,
      });

      map.current.addLayer({
        id: `${layerId}-fill`,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": color,
          "fill-opacity": 0.4,
        },
      });

      map.current.addLayer({
        id: `${layerId}-outline`,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": color,
          "line-width": 3,
        },
      });

      // Add region label
      if (region.coordinates && region.coordinates.geometry && region.coordinates.geometry.type === 'Polygon') {
        const coordinates = region.coordinates.geometry.coordinates[0];
        if (coordinates && coordinates.length > 0) {
          // Calculate centroid
          const centroid = coordinates.reduce(
            (acc, coord) => {
              acc[0] += coord[0];
              acc[1] += coord[1];
              return acc;
            },
            [0, 0]
          ).map(val => val / coordinates.length);

          new mapboxgl.Marker({
            element: createRegionMarker(region),
            anchor: 'center'
          })
            .setLngLat(centroid)
            .addTo(map.current);
        }
      }

      map.current.on("click", `${layerId}-fill`, () => {
        setSelectedRegion(region);
        loadRegionIncidents(region.id);
        setShowIncidentDetails(true);
      });

      map.current.on("mouseenter", `${layerId}-fill`, () => {
        map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", `${layerId}-fill`, () => {
        map.current.getCanvas().style.cursor = "";
      });
    });
  };

  const createRegionMarker = (region) => {
    const el = document.createElement('div');
    el.className = 'region-marker';
    el.style.cssText = `
      background: white;
      border: 2px solid ${getSafetyColor(region.safety_score)};
      border-radius: 8px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      cursor: pointer;
      white-space: nowrap;
    `;
    el.innerHTML = `${region.region_name || 'Region'} (${region.safety_score})`;
    return el;
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  const handleRefresh = async () => {
    await Promise.all([loadRegions(), loadIncidentStats()]);
  };

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/6anesh/cmit56wet000r01r19b830ns6",
        center: [87.2718, 26.6637],
        zoom: 13,
      });

      map.current.addControl(new mapboxgl.NavigationControl());

      new mapboxgl.Marker()
        .setLngLat([87.2718, 26.6637])
        .setPopup(new mapboxgl.Popup().setHTML("<h3>Itahari, Nepal</h3>"))
        .addTo(map.current);

      map.current.on("load", async () => {
        const loadedRegions = await loadRegions();
        await loadIncidentStats();
        renderRegionsOnMap(loadedRegions);
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

  const handleIncidentUpdate = async () => {
    if (selectedRegion) {
      await loadRegionIncidents(selectedRegion.id);
    }
    await loadIncidentStats();
  };

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-gray-50 relative">
      {/* Map Container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full z-0 block"
      />

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex justify-between items-start">
        <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-4 border border-gray-200 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Admin Dashboard
              </h1>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                SafeMap Janakpur
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={handleRefresh}
            className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-2.5 border border-gray-200 hover:bg-white transition-all"
          >
            <RefreshCw className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 backdrop-blur-md shadow-lg rounded-xl px-4 py-2.5 text-sm font-semibold text-white border-0 hover:bg-red-700 transition-all active:scale-95 hover:shadow-xl"
          >
            <LogOut className="w-4 h-4 inline mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-4 border border-gray-200 pointer-events-auto">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalRegions}</div>
              <div className="text-xs text-gray-600">Regions</div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalIncidents}</div>
              <div className="text-xs text-gray-600">Incidents</div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.pendingValidation}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.avgSafetyScore.toFixed(1)}</div>
              <div className="text-xs text-gray-600">Avg Safety</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md rounded-xl shadow-lg px-5 py-4 max-w-xs pointer-events-auto border border-gray-200 z-20">
        <h3 className="font-bold mb-3 text-gray-900 text-sm flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
          Safety Color Code
        </h3>
        <ul className="text-xs space-y-2 text-gray-600">
          <li className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-green-500 shrink-0"></div>
            <span className="mt-0.5">Green = Safe (7-10)</span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-yellow-500 shrink-0"></div>
            <span className="mt-0.5">Yellow = Moderate (5-7)</span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-orange-500 shrink-0"></div>
            <span className="mt-0.5">Orange = Unsafe (3-5)</span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-red-600 shrink-0"></div>
            <span className="mt-0.5">Red = Dangerous (0-3)</span>
          </li>
        </ul>
      </div>

      {/* Selected Region Info */}
      {selectedRegion && (
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-4 max-w-sm pointer-events-auto border border-gray-200 z-20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">{selectedRegion.region_name || 'Selected Region'}</h3>
            <button
              onClick={() => {
                setSelectedRegion(null);
                setShowIncidentDetails(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Safety Score:</span>
              <span className={`font-semibold ${
                selectedRegion.safety_score >= 7 ? 'text-green-600' :
                selectedRegion.safety_score >= 5 ? 'text-yellow-600' :
                selectedRegion.safety_score >= 3 ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {selectedRegion.safety_score} ({getRiskLevel(selectedRegion.safety_score)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Incidents:</span>
              <span className="font-semibold text-gray-900">{regionIncidents.length}</span>
            </div>
            {regionIncidents.length > 0 && (
              <button
                onClick={() => setShowIncidentDetails(true)}
                className="w-full mt-3 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Incidents
              </button>
            )}
          </div>
        </div>
      )}

      {/* Incident Details Panel */}
      {showIncidentDetails && selectedRegion && (
        <div className="absolute top-24 right-4 bottom-6 w-[400px] shadow-2xl rounded-xl overflow-hidden bg-white border border-gray-200 flex flex-col transition-all pointer-events-auto animate-in slide-in-from-right-4 fade-in z-40">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Region Incidents</h2>
                <p className="text-blue-100 text-sm">{selectedRegion.region_name || 'Selected Region'}</p>
              </div>
              <button
                onClick={() => setShowIncidentDetails(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500">Loading incidents...</div>
            </div>
          ) : regionIncidents.length > 0 ? (
            <IncidentDetailsPanel
              incidents={regionIncidents}
              onClose={() => setShowIncidentDetails(false)}
              onUpdate={handleIncidentUpdate}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No incidents found in this region</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminMapDashboard;