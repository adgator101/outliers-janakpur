import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function DashboardMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  // ----------------------------
  // DUMMY REGIONS
  // ----------------------------
  const dummyRegions = [
    {
      id: 1,
      region_name: "Itahari-1",
      safety_score: 8,
      coordinates: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [87.2705, 26.6641],
              [87.2720, 26.6641],
              [87.2720, 26.6628],
              [87.2705, 26.6628],
              [87.2705, 26.6641],
            ],
          ],
        },
      },
    },
    {
      id: 2,
      region_name: "Itahari-2",
      safety_score: 4,
      coordinates: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [87.2730, 26.6648],
              [87.2745, 26.6648],
              [87.2745, 26.6633],
              [87.2730, 26.6633],
              [87.2730, 26.6648],
            ],
          ],
        },
      },
    },
  ];

  // ----------------------------
  // DUMMY INCIDENTS
  // ----------------------------
  const dummyIncidents = [
    { id: 101, region_id: 1, title: "Street light broken", status: "Pending" },
    { id: 102, region_id: 1, title: "Suspicious activity reported", status: "Approved" },
    { id: 201, region_id: 2, title: "Pickpocket case", status: "Pending" },
  ];

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionIncidents, setRegionIncidents] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);

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

  // ----------------------------
  // LOAD INCIDENTS FOR REGION
  // ----------------------------
  const loadRegionIncidents = (id) => {
    const incidents = dummyIncidents.filter((i) => i.region_id === id);
    setRegionIncidents(incidents);
  };

  // ----------------------------
  // INITIALIZE MAP
  // ----------------------------
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
      dummyRegions.forEach((region) => {
        const sourceId = `region-${region.id}`;
        const layerId = `region-layer-${region.id}`;

        // Add source
        map.current.addSource(sourceId, {
          type: "geojson",
          data: region.coordinates,
        });

        // Fill layer
        map.current.addLayer({
          id: `${layerId}-fill`,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": getSafetyColor(region.safety_score),
            "fill-opacity": 0.4,
          },
        });

        // Outline
        map.current.addLayer({
          id: `${layerId}-outline`,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": getSafetyColor(region.safety_score),
            "line-width": 2,
          },
        });

        // Click handler
        map.current.on("click", `${layerId}-fill`, () => {
          setSelectedRegion(region);
          loadRegionIncidents(region.id);
          setShowSidebar(true);
        });
      });
    });
  }, []);

  return (
    <div className="flex gap-4">

      {/* LEFT: MAP BOX */}
      <div className="relative h-[600px] flex-1 rounded-xl overflow-hidden shadow">
        <div ref={mapContainer} className="h-full w-full" />

        {/* LEGEND */}
        <div className="absolute bottom-3 left-3 bg-white/90 p-3 rounded-lg shadow text-xs text-black">
          <div className="font-semibold mb-1 text-black">Safety Levels</div>
          <div className="flex items-center gap-2 text-black">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span> Safe
          </div>
          <div className="flex items-center gap-2 text-black">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span> Moderate
          </div>
          <div className="flex items-center gap-2 text-black">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span> Unsafe
          </div>
          <div className="flex items-center gap-2 text-black">
            <span className="w-3 h-3 bg-red-600 rounded-full"></span> Danger
          </div>
        </div>
      </div>

      {/* RIGHT: SIDEBAR */}
      <div className="w-[380px]">
        {showSidebar && selectedRegion ? (
          <div className="h-[600px] bg-white rounded-xl shadow-xl p-4 border flex flex-col">

            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg text-black">{selectedRegion.region_name}</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-black hover:text-gray-700"
              >
                ✖
              </button>
            </div>

            <div className="mb-3 text-sm text-black">
              <p className="text-black">
                <span className="font-semibold text-black">Safety Score:</span>{" "}
                {selectedRegion.safety_score} (
                {getRiskLevel(selectedRegion.safety_score)})
              </p>
              <p className="text-black">
                <span className="font-semibold text-black">Incidents:</span>{" "}
                {regionIncidents.length}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {regionIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="border rounded-lg p-3 mb-2 shadow-sm bg-gray-50"
                >
                  <p className="font-semibold text-black">{inc.title}</p>
                  <p className="text-xs text-black">Status: {inc.status}</p>
                </div>
              ))}

              {regionIncidents.length === 0 && (
                <p className="text-black text-center mt-20">
                  No incidents found
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[600px] border rounded-xl shadow flex items-center justify-center text-black">
            Select a region on the map
          </div>
        )}
      </div>
    </div>
  );
}
