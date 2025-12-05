import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { loadCrimeGeoJSON, GeoJSONData } from "../utils/parseCrimeCSV";

mapboxgl.accessToken = "YOUR_MAPBOX_ACCESS_TOKEN";

export default function CrimeHeatmap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [crimeData, setCrimeData] = useState<GeoJSONData | null>(null);

  useEffect(() => {
    loadCrimeGeoJSON().then(data => setCrimeData(data));
  }, []);

  useEffect(() => {
    if (!crimeData || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [78.9629, 20.5937],
      zoom: 4
    });

    map.current.on("load", () => {
      map.current?.addSource("crime", {
        type: "geojson",
        data: crimeData
      });

      map.current?.addLayer({
        id: "crime-heat",
        type: "heatmap",
        source: "crime",
        paint: {
          "heatmap-radius": 40,
          "heatmap-opacity": 0.85,
          "heatmap-intensity": 1,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "green",
            0.4, "yellow",
            1, "red"
          ]
        }
      });
    });
  }, [crimeData]);

  return (
    <div
      ref={mapContainer}
      style={{ height: "600px", width: "100%" }}
    />
  );
}
