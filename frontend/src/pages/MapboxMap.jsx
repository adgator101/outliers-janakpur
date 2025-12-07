import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import RegionDetailsPanel from "../components/RegionDetailsPanel";
import IncidentReportForm from "../components/IncidentReportForm";
import { regionAPI, authAPI } from "../utils/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapboxMap() {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const [currentFeature, setCurrentFeature] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [regions, setRegions] = useState([]);

  const getSafetyColor = (safetyScore) => {
    if (safetyScore >= 7) return "#4ade80";
    if (safetyScore >= 5) return "#fbbf24";
    if (safetyScore >= 3) return "#f97316";
    return "#dc2626";
  };

  const loadRegions = async () => {
    try {
      const data = await regionAPI.getAll();
      setRegions(data.regions);
      return data.regions;
    } catch (error) {
      console.error("Error loading regions:", error);
      return [];
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

      map.current.on("click", `${layerId}-fill`, () => {
        setSelectedRegionId(region.id);
      });

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
    if (map.current) return;
    if (!mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        // style: "mapbox://styles/mapbox/streets-v12",
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
        draw.current = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            point: true,
            trash: true,
          },
        });

        map.current.addControl(draw.current);

        const loadedRegions = await loadRegions();
        renderRegionsOnMap(loadedRegions);

        map.current.on("draw.create", (e) => {
          setCurrentFeature(e.features[0]);
          setShowReportForm(true);
        });

        map.current.on("draw.delete", () => {
          // Cleanup logic
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
    if (currentFeature && draw.current) {
      draw.current.delete(currentFeature.id);
    }

    const loadedRegions = await loadRegions();

    regions.forEach((region) => {
      const layerId = `region-layer-${region.id}`;
      try {
        if (map.current.getLayer(`${layerId}-fill`)) {
          map.current.removeLayer(`${layerId}-fill`);
        }
        if (map.current.getLayer(`${layerId}-outline`)) {
          map.current.removeLayer(`${layerId}-outline`);
        }
        if (map.current.getSource(`region-${region.id}`)) {
          map.current.removeSource(`region-${region.id}`);
        }
      } catch (e) {
        console.error("Error removing layer:", e);
      }
    });

    renderRegionsOnMap(loadedRegions);
  };

  const handleFormClose = () => {
    if (currentFeature && draw.current) {
      draw.current.delete(currentFeature.id);
    }
    setShowReportForm(false);
    setCurrentFeature(null);
  };

  const handleDetailsUpdate = async () => {
    await loadRegions();
  };

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-gray-50 relative">
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full z-0 block"
      />

      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex justify-between items-start">
        <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-3 border border-gray-200 pointer-events-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div className="pr-2">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              SafeMap
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              Janakpur
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl px-4 py-2 border border-gray-200">
            <span className="font-bold text-gray-900">{regions.length}</span>
            <span className="text-sm text-gray-600 ml-1">regions</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md rounded-xl shadow-lg px-5 py-4 max-w-xs pointer-events-auto border border-gray-200">
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
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 font-bold text-[10px]">
                →
              </div>
              <span className="mt-0.5">Draw on map to report</span>
            </li>
          </ul>
        </div>

        {showReportForm && currentFeature && (
          <div className="absolute top-24 right-4 bottom-6 w-[400px] shadow-2xl rounded-xl overflow-hidden bg-white border border-gray-200 flex flex-col transition-all pointer-events-auto animate-in slide-in-from-right-4 fade-in">
            <IncidentReportForm
              coordinates={currentFeature.geometry}
              areaType={currentFeature.geometry.type}
              onClose={handleFormClose}
              onSuccess={handleReportSuccess}
            />
          </div>
        )}

        {selectedRegionId && (
          <div className="absolute top-24 right-4 bottom-6 w-[400px] shadow-2xl rounded-xl overflow-hidden bg-white border border-gray-200 flex flex-col transition-all pointer-events-auto animate-in slide-in-from-right-4 fade-in">
            <RegionDetailsPanel
              regionId={selectedRegionId}
              onClose={() => setSelectedRegionId(null)}
              onUpdate={handleDetailsUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MapboxMap;
