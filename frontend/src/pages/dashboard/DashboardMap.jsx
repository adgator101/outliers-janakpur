import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { regionAPI } from '../../utils/api';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoicm9iaW5kdW0iLCJhIjoiY200YjVvazVqMHQ0bDJrcHVkY2J4cnF5eSJ9.AvW4tC7X4i9Tz2pI1Gj2qQ'; 

export default function DashboardMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    async function fetchRegions() {
      try {
        const data = await regionAPI.getAll();
        setRegions(data.regions || []);
        if (map.current && data.regions?.length > 0) {
            renderRegions(map.current, data.regions);
        }
      } catch (error) {
        console.error("Failed to fetch regions", error);
      }
    }
    fetchRegions();
  }, []);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    mapboxgl.accessToken = TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Mapbox Dark style for dashboard
      center: [85.3240, 27.7172], // Kathmandu default
      zoom: 12
    });

    map.current.on('load', () => {
        if (regions.length > 0) {
            renderRegions(map.current, regions);
        }
    });

  }, [regions]); // Re-run if regions load after map

  const renderRegions = (mapInstance, regionsData) => {
      // Loop through regions and add sources/layers
      regionsData.forEach(region => {
          if (!mapInstance.getSource(`region-${region.id}`)) {
              mapInstance.addSource(`region-${region.id}`, {
                  'type': 'geojson',
                  'data': {
                      'type': 'Feature',
                      'geometry': {
                          'type': 'Polygon',
                          'coordinates': region.coordinates
                      }
                  }
              });

              // Color based on safety score
              // < 30 : Red (High Risk)
              // 30-70: Yellow (Moderate)
              // > 70 : Green (Safe)
              let color = '#ef4444'; // red
              if (region.safety_score >= 70) color = '#22c55e';
              else if (region.safety_score >= 30) color = '#eab308';

              mapInstance.addLayer({
                  'id': `region-fill-${region.id}`,
                  'type': 'fill',
                  'source': `region-${region.id}`,
                  'layout': {},
                  'paint': {
                      'fill-color': color,
                      'fill-opacity': 0.4
                  }
              });

              mapInstance.addLayer({
                  'id': `region-outline-${region.id}`,
                  'type': 'line',
                  'source': `region-${region.id}`,
                  'layout': {},
                  'paint': {
                      'line-color': color,
                      'line-width': 2
                  }
              });
              
              // Add popup/click event
               mapInstance.on('click', `region-fill-${region.id}`, (e) => {
                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`
                            <div class="p-2 text-black">
                                <strong>Region</strong><br/>
                                Safety Score: ${region.safety_score}<br/>
                                Incidents: ${region.incident_count}
                            </div>
                        `)
                        .addTo(mapInstance);
                });
          }
      });
  };

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden shadow">
       <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
