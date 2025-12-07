import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapboxMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const [geoJson, setGeoJson] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(null);
  const [selectedIssueType, setSelectedIssueType] = useState("");

  const issueTypes = [
    { value: "report_zone", label: "Report Zone", color: "#ff4444" },
    { value: "hazard_area", label: "Hazard Area", color: "#ff8800" },
    { value: "safe_zone", label: "Safe Zone", color: "#44ff44" },
    { value: "emergency_area", label: "Emergency Area", color: "#4444ff" },
    { value: "restricted_zone", label: "Restricted Zone", color: "#ff0088" },
    { value: "monitoring_zone", label: "Monitoring Zone", color: "#8800ff" },
  ];

  // Define updateGeoJson function outside of useEffect
  const updateGeoJson = () => {
    if (draw.current) {
      const data = draw.current.getAll();
      setGeoJson(data);
      // Save to localStorage
      localStorage.setItem("mapbox-zones", JSON.stringify(data));
      console.log("GeoJSON from Mapbox:", JSON.stringify(data, null, 2));
    }
  };

  // Load zones from localStorage
  const loadZonesFromStorage = () => {
    try {
      const savedZones = localStorage.getItem("mapbox-zones");
      if (savedZones) {
        const data = JSON.parse(savedZones);
        return data;
      }
    } catch (error) {
      console.error("Error loading zones from localStorage:", error);
    }
    return null;
  };

  // Restore colored layers for saved zones
  const restoreColoredLayers = (zones) => {
    if (!zones || !zones.features) return;

    zones.features.forEach((feature) => {
      if (
        feature.properties &&
        feature.properties.color &&
        feature.properties.issueType
      ) {
        const layerId = `feature-${feature.id}`;
        const sourceId = `source-${feature.id}`;

        try {
          if (!map.current.getSource(sourceId)) {
            map.current.addSource(sourceId, {
              type: "geojson",
              data: feature,
            });

            // Add fill layer
            map.current.addLayer({
              id: `${layerId}-fill`,
              type: "fill",
              source: sourceId,
              paint: {
                "fill-color": feature.properties.color,
                "fill-opacity": 0.3,
              },
            });

            // Add outline layer
            map.current.addLayer({
              id: `${layerId}-outline`,
              type: "line",
              source: sourceId,
              paint: {
                "line-color": feature.properties.color,
                "line-width": 2,
              },
            });
          }
        } catch (error) {
          console.error("Error restoring colored layer:", error);
        }
      }
    });
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
      map.current.on("load", () => {
        draw.current = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            rectangle: true,
            circle: true,
            line_string: true,
            point: true,
            trash: true,
          },
        });

        map.current.addControl(draw.current);

        // Load and restore saved zones
        const savedZones = loadZonesFromStorage();
        if (savedZones && savedZones.features.length > 0) {
          draw.current.set(savedZones);
          setGeoJson(savedZones);
          // Restore colored layers after a short delay to ensure draw control is ready
          setTimeout(() => {
            restoreColoredLayers(savedZones);
          }, 100);
        }

        // Listen for draw events
        map.current.on("draw.create", (e) => {
          console.log("Draw create event triggered", e.features[0]);
          setCurrentFeature(e.features[0]);
          setShowOverlay(true);
        });

        map.current.on("draw.delete", () => {
          // Remove associated colored layers when feature is deleted
          const allFeatures = draw.current.getAll();
          const currentFeatureIds = allFeatures.features.map((f) => f.id);

          // Clean up layers for deleted features
          const savedZones = loadZonesFromStorage();
          if (savedZones && savedZones.features) {
            savedZones.features.forEach((feature) => {
              if (!currentFeatureIds.includes(feature.id)) {
                const layerId = `feature-${feature.id}`;
                const sourceId = `source-${feature.id}`;

                try {
                  if (map.current.getLayer(`${layerId}-fill`)) {
                    map.current.removeLayer(`${layerId}-fill`);
                  }
                  if (map.current.getLayer(`${layerId}-outline`)) {
                    map.current.removeLayer(`${layerId}-outline`);
                  }
                  if (map.current.getSource(sourceId)) {
                    map.current.removeSource(sourceId);
                  }
                } catch (error) {
                  console.error("Error cleaning up layers:", error);
                }
              }
            });
          }

          updateGeoJson();
        });

        map.current.on("draw.update", () => {
          updateGeoJson();
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

  const handleIssueTypeSelect = (issueType) => {
    if (currentFeature && draw.current) {
      // Add properties to the feature
      const updatedFeature = {
        ...currentFeature,
        properties: {
          ...currentFeature.properties,
          issueType: issueType.value,
          issueLabel: issueType.label,
          color: issueType.color,
          timestamp: new Date().toISOString(),
          id: Date.now(),
        },
      };

      try {
        // First, update the feature properties in the draw control
        // Don't delete and re-add, just update the existing feature's properties
        const allFeatures = draw.current.getAll();
        const featureIndex = allFeatures.features.findIndex(
          (f) => f.id === currentFeature.id
        );

        if (featureIndex !== -1) {
          // Update the feature properties
          allFeatures.features[featureIndex].properties = {
            ...allFeatures.features[featureIndex].properties,
            ...updatedFeature.properties,
          };

          // Set the updated data back to the draw control
          draw.current.set(allFeatures);
        }

        // Create a unique layer ID for this feature
        const layerId = `feature-${currentFeature.id}`;
        const sourceId = `source-${currentFeature.id}`;

        // Add colored layer for this specific feature
        if (!map.current.getSource(sourceId)) {
          map.current.addSource(sourceId, {
            type: "geojson",
            data: {
              ...currentFeature,
              properties: updatedFeature.properties,
            },
          });

          // Add fill layer
          map.current.addLayer({
            id: `${layerId}-fill`,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": issueType.color,
              "fill-opacity": 0.3,
            },
          });

          // Add outline layer
          map.current.addLayer({
            id: `${layerId}-outline`,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": issueType.color,
              "line-width": 2,
            },
          });
        }

        // Get the final updated data and save to localStorage
        const finalData = draw.current.getAll();
        setGeoJson(finalData);
        localStorage.setItem("mapbox-zones", JSON.stringify(finalData));
        console.log(
          "Updated GeoJSON with issue type:",
          JSON.stringify(finalData, null, 2)
        );
      } catch (error) {
        console.error("Error adding map layer:", error);
      }

      // Close overlay
      setShowOverlay(false);
      setCurrentFeature(null);
      setSelectedIssueType("");
    }
  };

  const handleOverlayCancel = () => {
    if (currentFeature && draw.current) {
      // Remove the drawn feature if cancelled
      draw.current.delete(currentFeature.id);
    }
    setShowOverlay(false);
    setCurrentFeature(null);
    setSelectedIssueType("");
  };

  return (
    <div className="w-screen h-screen m-0 p-0">
      <div ref={mapContainer} className="h-screen w-full" />

      {/* Debug info and controls */}
      <div className="absolute top-16 right-2.5 bg-white/90 p-2.5 rounded text-xs z-50">
        <div>Show Overlay: {showOverlay ? "true" : "false"}</div>
        <div>Current Feature: {currentFeature ? "exists" : "null"}</div>
        <div>Zones in Storage: {geoJson ? geoJson.features.length : 0}</div>
        <button
          onClick={() => {
            localStorage.removeItem("mapbox-zones");
            if (draw.current) {
              draw.current.deleteAll();
            }
            // Remove all colored layers
            if (map.current) {
              const style = map.current.getStyle();
              const layersToRemove = style.layers.filter(
                (layer) =>
                  layer.id.startsWith("feature-") &&
                  (layer.id.includes("-fill") || layer.id.includes("-outline"))
              );
              layersToRemove.forEach((layer) => {
                try {
                  map.current.removeLayer(layer.id);
                } catch (e) {}
              });

              // Remove sources
              Object.keys(style.sources).forEach((sourceId) => {
                if (sourceId.startsWith("source-")) {
                  try {
                    map.current.removeSource(sourceId);
                  } catch (e) {}
                }
              });
            }
            setGeoJson(null);
            updateGeoJson();
          }}
          className="mt-2 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
        >
          Clear All Zones
        </button>
      </div>

      {/* Overlay for issue type selection */}
      {showOverlay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]">
          <div className="bg-white p-7 rounded-2xl max-w-lg w-[90%] shadow-2xl">
            <h3 className="m-0 mb-5 text-center text-gray-800 text-2xl font-bold">
              Select Issue Type
            </h3>
            <p className="text-center text-gray-600 mb-6">
              Choose the type of zone you've drawn:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {issueTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleIssueTypeSelect(type)}
                  className={`
                    p-4 border-2 rounded-xl cursor-pointer text-sm font-bold 
                    transition-all duration-300 flex items-center justify-center gap-2
                    hover:shadow-lg
                    ${
                      selectedIssueType === type.value
                        ? "text-white"
                        : "bg-white hover:bg-opacity-20"
                    }
                  `}
                  style={{
                    borderColor: type.color,
                    backgroundColor:
                      selectedIssueType === type.value ? type.color : "white",
                    color:
                      selectedIssueType === type.value ? "white" : type.color,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  ></div>
                  {type.label}
                </button>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleOverlayCancel}
                className="py-3 px-6 bg-red-600 text-white border-none rounded-lg cursor-pointer text-base font-bold hover:bg-red-700 transition-colors duration-200"
              >
                Cancel & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapboxMap;
