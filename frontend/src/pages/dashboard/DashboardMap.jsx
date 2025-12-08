import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, X, MapPin, Calendar, User, AlertTriangle, Siren, Construction, Lightbulb, Shield, Eye } from "lucide-react";
import { regionAPI, authAPI } from "../../utils/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function DashboardMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const mapLoadedRef = useRef(false);

  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionIncidents, setRegionIncidents] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isFetchingIncidents, setIsFetchingIncidents] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = authAPI.getUserRole();
    setUserRole(role);
  }, []);

  const getSafetyColor = (score) => {
    if (score >= 7) return "#22c55e";
    if (score >= 5) return "#fbbf24";
    if (score >= 3) return "#f97316";
    return "#dc2626";
  };

  const getRiskLevel = (score) => {
    if (score >= 7) return "Low";
    if (score >= 5) return "Medium";
    if (score >= 3) return "High";
    return "Critical";
  };

  const getRiskLevelColor = (score) => {
    if (score >= 7) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (score >= 3) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getIncidentTypeIcon = (type) => {
    const iconMap = {
      accident: <Siren className="h-4 w-4" />,
      crime: <AlertTriangle className="h-4 w-4" />,
      infrastructure: <Construction className="h-4 w-4" />,
      other: <Lightbulb className="h-4 w-4" />,
    };
    return iconMap[type] || <MapPin className="h-4 w-4" />;
  };

  const getIncidentTypeColor = (type) => {
    const colorMap = {
      accident: "text-red-600 bg-red-50",
      crime: "text-orange-600 bg-orange-50",
      infrastructure: "text-blue-600 bg-blue-50",
      other: "text-gray-600 bg-gray-50",
    };
    return colorMap[type] || "text-gray-600 bg-gray-50";
  };

  const getSeverityBadgeColor = (severity) => {
    const colorMap = {
      critical: "bg-red-100 text-red-700 border-red-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-green-100 text-green-700 border-green-200",
    };
    return colorMap[severity] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const clearRegionLayers = () => {
    if (!map.current || !mapLoadedRef.current) return;
    const style = map.current.getStyle();
    if (!style) return;

    style.layers
      ?.filter((layer) => layer.id.startsWith("region-layer-"))
      .forEach((layer) => {
        if (map.current.getLayer(layer.id)) {
          map.current.removeLayer(layer.id);
        }
      });

    Object.keys(style.sources || {})
      .filter((sourceId) => sourceId.startsWith("region-"))
      .forEach((sourceId) => {
        if (map.current.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      });
  };

  const loadRegionIncidents = async (id) => {
    try {
      const data = await regionAPI.getIncidents(id);
      setRegionIncidents(data.incidents || []);
    } catch (err) {
      console.error("Failed to load region incidents", err);
      setRegionIncidents([]);
    }
  };

  const handleRegionSelection = async (region) => {
    setSelectedRegion(region);
    setShowSidebar(true);
    setIsFetchingIncidents(true);
    setRegionIncidents([]);

    try {
      await loadRegionIncidents(region.id);
    } finally {
      setIsFetchingIncidents(false);
    }
  };

  const renderRegionsOnMap = (regionsList) => {
    if (!map.current || !mapLoadedRef.current) return;

    regionsList.forEach((region) => {
      if (!region?.coordinates) return;

      const sourceId = `region-${region.id}`;
      const fillId = `region-layer-${region.id}-fill`;
      const outlineId = `region-layer-${region.id}-outline`;
      const color = getSafetyColor(region.safety_score);

      map.current.addSource(sourceId, {
        type: "geojson",
        data: region.coordinates,
      });

      map.current.addLayer({
        id: fillId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": color,
          "fill-opacity": 0.4,
        },
      });

      map.current.addLayer({
        id: outlineId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": color,
          "line-width": 2,
        },
      });

      map.current.on("click", fillId, () => handleRegionSelection(region));

      map.current.on("mouseenter", fillId, () => {
        map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", fillId, () => {
        map.current.getCanvas().style.cursor = "";
      });
    });
  };

  const loadRegions = async () => {
    if (!map.current || !mapLoadedRef.current) return;
    try {
      setError(null);
      const data = await regionAPI.getAll();
      const fetchedRegions = data.regions || [];
      setRegions(fetchedRegions);
      clearRegionLayers();
      renderRegionsOnMap(fetchedRegions);
    } catch (err) {
      console.error("Failed to load regions", err);
      setError("Failed to load region data. Please try again.");
    }
  };

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [87.2718, 26.6637],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("load", () => {
      mapLoadedRef.current = true;
      loadRegions();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      mapLoadedRef.current = false;
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Regional Safety Map
            </h1>
            <p className="text-gray-600 mt-2">
              Interactive map showing safety scores and incident reports across regions
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Regions</p>
              <p className="text-2xl font-bold text-gray-900">{regions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="relative flex-1 rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <div ref={mapContainer} className="h-full w-full" />

          <div className="absolute bottom-3 left-3 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600" />
                Safety Levels
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5">{regions.length} active regions</div>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <span className="w-4 h-4 bg-green-500 rounded-full shadow-sm border border-green-600"></span>
                <span className="font-medium">Safe (7-10)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <span className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm border border-yellow-600"></span>
                <span className="font-medium">Moderate (5-6)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <span className="w-4 h-4 bg-orange-500 rounded-full shadow-sm border border-orange-600"></span>
                <span className="font-medium">Unsafe (3-4)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <span className="w-4 h-4 bg-red-600 rounded-full shadow-sm border border-red-700"></span>
                <span className="font-medium">Danger (0-2)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[420px] flex flex-col min-h-0">
          {showSidebar && selectedRegion ? (
            <div className="h-full bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="font-bold text-xl text-gray-900 mb-1">{selectedRegion.region_name}</h2>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Region Overview
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 rounded-lg hover:bg-white/50 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Close region details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Safety Score Card */}
                <div className="bg-white rounded-lg p-3 border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Safety Score</span>
                    <Shield className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{selectedRegion.safety_score}</div>
                      <div className="text-xs text-gray-500 mt-0.5">out of 10</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskLevelColor(selectedRegion.safety_score)}`}>
                      {getRiskLevel(selectedRegion.safety_score)} Risk
                    </span>
                  </div>
                </div>
              </div>

              {/* Incidents Section */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Recent Incidents</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {isFetchingIncidents ? "..." : regionIncidents.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {isFetchingIncidents ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
                      Loading incidents...
                    </div>
                  ) : regionIncidents.length > 0 ? (
                    <div className="space-y-3">
                      {regionIncidents.map((incident) => (
                        <div
                          key={incident.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
                        >
                          {/* Incident Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${getIncidentTypeColor(incident.incident_type)}`}>
                              {getIncidentTypeIcon(incident.incident_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                                {incident.description || "Incident Report"}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityBadgeColor(incident.severity)}`}>
                                  {incident.severity || "N/A"}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                  {incident.incident_type?.replace("_", " ") || "Unknown"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Incident Details */}
                          <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{formatDate(incident.created_at)}</span>
                            </div>
                            {incident.reported_by && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="truncate">Reported by user</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                incident.status === 'resolved' ? 'bg-green-500' :
                                incident.status === 'in_progress' ? 'bg-blue-500' :
                                incident.status === 'pending' ? 'bg-yellow-500' :
                                'bg-gray-400'
                              }`}></div>
                              <span className="capitalize">{incident.status?.replace("_", " ") || "Pending"}</span>
                            </div>
                          </div>

                          {/* Validation Status */}
                          {(incident.ngo_validated || incident.admin_validated) && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-xs">
                                {incident.ngo_validated && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    NGO Verified
                                  </span>
                                )}
                                {incident.admin_validated && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    Admin Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Hint */}
                          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Shield className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">No Incidents Recorded</p>
                      <p className="text-xs text-gray-500">This region has no reported incidents</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white border border-gray-200 rounded-xl shadow flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Region</h3>
              <p className="text-sm text-gray-600 mb-4">Click on any region on the map to view detailed incident reports and safety information</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="h-4 w-4" />
                <span>{regions.length} regions available</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
