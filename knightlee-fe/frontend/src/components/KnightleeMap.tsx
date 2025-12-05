// // import React, { useEffect, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";
// import api from "../api/client";
// import React, { useEffect, useRef, useState } from "react";

// mapboxgl.accessToken = "pk.eyJ1IjoiYWJoaWFiaGluYW5kYW5hMDkiLCJhIjoiY21pc3E3Y3ZrMDB0NTNmc2J6Z2RhZXI4NyJ9.nsB4sflxG_e3KK2DYWwpqg"; // REQUIRED
// interface RouteBlackspotFeature {
//   type: "Feature";
//   properties: {
//     id: number;
//     name: string;
//     severity: number;
//     distance_km: number;
//   };
//   geometry: {
//     type: "Point";
//     coordinates: [number, number];
//   };
// }

// interface RouteBlackspotGeoJSON {
//   type: "FeatureCollection";
//   features: RouteBlackspotFeature[];
// }

// interface RouteSafetySummary {
//   route_distance_km: number;
//   total_blackspots: number;
//   avg_severity: number;
//   max_severity: number;
//   min_distance_km: number | null;
//   buffer_km: number;
//   safety_percentage: number;
// }

// interface RouteBlackspotResponse {
//   summary: RouteSafetySummary;
//   geojson: RouteBlackspotGeoJSON;
// }

// type RouteInfo = {
//   id: "fastest" | "safest";
//   geometry: GeoJSON.LineString;
//   safety_score: number;
//   distance: number;
//   duration: number;
// };

// type SafePoint = {
//   name: string;
//   type: string;
//   latitude: number;
//   longitude: number;
// };

// const KnightleeMap: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
//   const mapContainer = useRef<HTMLDivElement | null>(null);
//   const mapRef = useRef<mapboxgl.Map | null>(null);

//   const [start, setStart] = useState("76.2711,9.9816");
//   const [end, setEnd] = useState("76.2905,9.9634");

//   const [routes, setRoutes] = useState<RouteInfo[]>([]);
//   const [recommendedId, setRecommendedId] =
//     useState<"fastest" | "safest" | null>(null);

//   const [safePoints, setSafePoints] = useState<SafePoint[]>([]);
//   const [infoMsg, setInfoMsg] = useState<string | null>(
//     "Enter coordinates or click Safest Route to demo."
//   );

//   // -------- INIT MAP + HEATMAP ----------
//   useEffect(() => {
//     if (mapRef.current) return;

//     const map = new mapboxgl.Map({
//       container: mapContainer.current as HTMLElement,
//       style: "mapbox://styles/mapbox/dark-v11",
//       center: [76.2711, 9.9816],
//       zoom: 12,
//     });

//     mapRef.current = map;

//    map.on("load", async () => {
//   try {
//     // 🔥 INCIDENT HEATMAP
//     const incidentsRes = await api.get("/incidents/geojson/");
//     map.addSource("incident-points", {
//       type: "geojson",
//       data: incidentsRes.data,
//     });

//     map.addLayer({
//       id: "incident-heat",
//       type: "heatmap",
//       source: "incident-points",
//       maxzoom: 16,
//       paint: {
//         "heatmap-weight": ["+", 1, ["get", "upvotes"]],
//         "heatmap-radius": 25,
//         "heatmap-opacity": 0.8,
//       },
//     });

//     // ⚠️ BLACKSPOTS POINT MARKERS
//     const blackspotsRes = await api.get("/blackspots/geojson/");
//     map.addSource("blackspots", {
//       type: "geojson",
//       data: blackspotsRes.data,
//     });

//     map.addLayer({
//       id: "blackspots-layer",
//       type: "circle",
//       source: "blackspots",
//       paint: {
//         // severity-based colors
//         "circle-color": [
//           "case",
//           [">=", ["get", "severity"], 4], "#ff0000",   // 🔴 very high risk
//           ["==", ["get", "severity"], 3], "#ff8800",   // 🟠 medium risk
//           "#00cc44"                                    // 🟢 low risk
//         ],
//         "circle-radius": 8,
//         "circle-opacity": 0.9,
//       },
//     });

//     // Popup on click
//     map.on("click", "blackspots-layer", (e: any) => {
//       const props = e.features[0].properties;
//       const [lng, lat] = e.features[0].geometry.coordinates;

//       new mapboxgl.Popup()
//         .setLngLat([lng, lat])
//         .setHTML(`
//           <b>${props.name}</b><br/>
//           Severity: <strong>${props.severity}</strong>
//         `)
//         .addTo(map);
//     });

//     setInfoMsg("Heatmap + Blackspots Loaded ✔");
//   } catch (err) {
//     setInfoMsg("❌ Error loading map data");
//   }
// });

//   }, []);

//   // -------- ROUTE HANDLER ----------
//   const fetchRoute = async (mode: "fastest" | "safest") => {
//     try {
//       const res = await api.get("/route/", { params: { start, end, mode } });
//       const route = res.data;

//       const r: RouteInfo = {
//         id: mode,
//         geometry: route.routes[0].geometry,
//         safety_score: route.safety_score,
//         distance: route.routes[0].distance,
//         duration: route.routes[0].duration,
//       };

//       const updated = [...routes.filter((x) => x.id !== mode), r];
//       setRoutes(updated);

//       if (updated.length === 2) {
//         const best = updated.reduce((a, b) =>
//           a.safety_score >= b.safety_score ? a : b
//         );
//         setRecommendedId(best.id);
//       }

//       drawRouteOnMap(r);
//     } catch {
//       setInfoMsg("Route fetch failed.");
//     }
//   };

//   const drawRouteOnMap = (route: RouteInfo) => {
//     const map = mapRef.current;
//     if (!map) return;

//     const sourceId = `route-${route.id}`;
//     const layerId = `route-layer-${route.id}`;

//     if (map.getLayer(layerId)) map.removeLayer(layerId);
//     if (map.getSource(sourceId)) map.removeSource(sourceId);

//     map.addSource(sourceId, {
//       type: "geojson",
//       data: { type: "Feature", geometry: route.geometry, properties: {} },
//     });

//     map.addLayer({
//       id: layerId,
//       type: "line",
//       source: sourceId,
//       layout: { "line-cap": "round", "line-join": "round" },
//       paint: {
//         "line-width": route.id === recommendedId ? 6 : 4,
//         "line-color":
//           route.id === "fastest"
//             ? "#888"
//             : route.id === "safest"
//             ? "#00ff00"
//             : "#ff8800",
//       },
//     });

//     const coords = route.geometry.coordinates;
//     const bounds = new mapboxgl.LngLatBounds(
//       coords[0] as [number, number],
//       coords[0] as [number, number]
//     );
//     coords.forEach((c) => bounds.extend(c as [number, number]));
//     map.fitBounds(bounds, { padding: 40 });
//   };

//   // -------- INCIDENT REPORT ----------
//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map) return;

//     const reportHandler = (e: any) => {
//       const { lng, lat } = e.lngLat;
//       const description = prompt("Describe incident at this location");
//       if (!description) return;

//       api
//         .post("/incident/", {
//           incident_type: "DARK_ROAD",
//           description,
//           latitude: lat,
//           longitude: lng,
//         })
//         .then(() => window.location.reload())
//         .catch(() => alert("Failed to report incident"));
//     };

//     map.on("contextmenu", reportHandler);
//     return () => map.off("contextmenu", reportHandler);
//   }, []);

//   // -------- SOS ----------
//   const handleSOS = async () => {
//     try {
//       const [lngStr, latStr] = end.split(",");
//       const latitude = parseFloat(latStr);
//       const longitude = parseFloat(lngStr);

//       await api.post("/sos/", { latitude, longitude });
//       const text = encodeURIComponent(
//         `SOS! Need help. Location: https://maps.google.com/?q=${latitude},${longitude}`
//       );
//       window.open(`https://wa.me/?text=${text}`, "_blank");
//     } catch {
//       alert("SOS failed");
//     }
//   };

//   // -------- SAFE POINTS ----------
//   const handleSafePoints = async () => {
//     try {
//       const [lngStr, latStr] = end.split(",");
//       const res = await api.get("/safe-points/", {
//         params: { near: `${latStr},${lngStr}` },
//       });

//       setSafePoints(res.data.points || []);
//       const map = mapRef.current;

//       res.data.points.forEach((p: SafePoint) => {
//         new mapboxgl.Marker({ color: "#38bdf8" })
//           .setLngLat([p.longitude, p.latitude])
//           .setPopup(new mapboxgl.Popup().setHTML(`<b>${p.name}</b><br>${p.type}`))
//           .addTo(map!);
//       });
//     } catch {
//       alert("Failed safe points fetch");
//     }
//   };

// return (
//   {routeSafety && (
//   <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white px-4 py-3 rounded-xl shadow-lg w-80 space-y-2 border border-slate-700">
//     <div className="flex items-center justify-between">
//       <span className="text-sm font-semibold">Route Safety</span>
//       <span
//         className={`text-lg font-bold ${
//           routeSafety.safety_percentage >= 80
//             ? "text-green-400"
//             : routeSafety.safety_percentage >= 50
//             ? "text-yellow-400"
//             : "text-red-400"
//         }`}
//       >
//         {routeSafety.safety_percentage}%
//       </span>
//     </div>

//     <div className="text-xs text-slate-300">
//       Distance: <strong>{routeSafety.route_distance_km} km</strong>
//     </div>

//     <div className="text-xs text-slate-300">
//       Blackspots on route:{" "}
//       <strong>{routeSafety.total_blackspots}</strong>{" "}
//       (avg severity {routeSafety.avg_severity}, max {routeSafety.max_severity})
//     </div>

//     {routeSafety.min_distance_km !== null && (
//       <div className="text-xs text-slate-300">
//         Closest blackspot to route:{" "}
//         <strong>{routeSafety.min_distance_km} km</strong>
//       </div>
//     )}

//     <div className="w-full bg-slate-700 rounded-full h-2 mt-1 overflow-hidden">
//       <div
//         className={`h-2 rounded-full ${
//           routeSafety.safety_percentage >= 80
//             ? "bg-green-400"
//             : routeSafety.safety_percentage >= 50
//             ? "bg-yellow-400"
//             : "bg-red-500"
//         }`}
//         style={{ width: `${routeSafety.safety_percentage}%` }}
//       />
//     </div>
//   </div>
// )}
// );
// };

// export default KnightleeMap;
import mapboxgl from "mapbox-gl";
import api from "../api/client";
import React, { useEffect, useRef, useState } from "react";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWJoaWFiaGluYW5kYW5hMDkiLCJhIjoiY21pc3E3Y3ZrMDB0NTNmc2J6Z2RhZXI4NyJ9.nsB4sflxG_e3KK2DYWwpqg";

interface RouteBlackspotFeature {
  type: "Feature";
  properties: {
    id: number;
    name: string;
    severity: number;
    distance_km: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface RouteBlackspotGeoJSON {
  type: "FeatureCollection";
  features: RouteBlackspotFeature[];
}

interface RouteSafetySummary {
  route_distance_km: number;
  total_blackspots: number;
  avg_severity: number;
  max_severity: number;
  min_distance_km: number | null;
  buffer_km: number;
  safety_percentage: number;
}

interface RouteBlackspotResponse {
  summary: RouteSafetySummary;
  geojson: RouteBlackspotGeoJSON;
}

type RouteInfo = {
  id: "fastest" | "safest";
  geometry: GeoJSON.LineString;
  safety_score: number;
  distance: number;
  duration: number;
};

type SafePoint = {
  name: string;
  type: string;
  latitude: number;
  longitude: number;
};

const KnightleeMap: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [start, setStart] = useState("76.2711,9.9816");
  const [end, setEnd] = useState("76.2905,9.9634");

  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [recommendedId, setRecommendedId] =
    useState<"fastest" | "safest" | null>(null);

  const [safePoints, setSafePoints] = useState<SafePoint[]>([]);
  const [infoMsg, setInfoMsg] = useState<string | null>(
    "Enter coordinates or click Safest Route to demo."
  );

  // ⭐ NEW: Route safety + blackspots along the chosen route
  const [routeSafety, setRouteSafety] = useState<RouteSafetySummary | null>(
    null
  );
  const [routeBlackspots, setRouteBlackspots] =
    useState<RouteBlackspotGeoJSON | null>(null);

  // -------- Helper to parse "lng,lat" string ----------
  const parseLngLat = (value: string) => {
    const [lngStr, latStr] = value.split(",");
    return {
      lng: parseFloat(lngStr),
      lat: parseFloat(latStr),
    };
  };

  // -------- INIT MAP + INCIDENT HEATMAP + STATIC BLACKSPOTS ----------
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [76.2711, 9.9816],
      zoom: 12,
    });

    mapRef.current = map;

    map.on("load", async () => {
      try {
        // 🔥 INCIDENT HEATMAP
        const incidentsRes = await api.get("/incidents/geojson/");
        map.addSource("incident-points", {
          type: "geojson",
          data: incidentsRes.data,
        });

        map.addLayer({
          id: "incident-heat",
          type: "heatmap",
          source: "incident-points",
          maxzoom: 16,
          paint: {
            "heatmap-weight": ["+", 1, ["get", "upvotes"]],
            "heatmap-radius": 25,
            "heatmap-opacity": 0.8,
          },
        });

        // ⚠️ STATIC BLACKSPOTS POINT MARKERS (global)
        const blackspotsRes = await api.get("/blackspots/geojson/");
        map.addSource("blackspots", {
          type: "geojson",
          data: blackspotsRes.data,
        });

        map.addLayer({
          id: "blackspots-layer",
          type: "circle",
          source: "blackspots",
          paint: {
            "circle-color": [
              "case",
              [">=", ["get", "severity"], 4],
              "#ff0000", // 🔴 very high risk
              ["==", ["get", "severity"], 3],
              "#ff8800", // 🟠 medium risk
              "#00cc44", // 🟢 low risk
            ],
            "circle-radius": 8,
            "circle-opacity": 0.9,
          },
        });

        map.on("click", "blackspots-layer", (e: any) => {
          const props = e.features[0].properties;
          const [lng, lat] = e.features[0].geometry.coordinates;

          new mapboxgl.Popup()
            .setLngLat([lng, lat])
            .setHTML(`
              <b>${props.name}</b><br/>
              Severity: <strong>${props.severity}</strong>
            `)
            .addTo(map);
        });

        setInfoMsg("Heatmap + Blackspots Loaded ✔");
      } catch (err) {
        console.error(err);
        setInfoMsg("❌ Error loading map data");
      }
    });
  }, []);

  // -------- NEW: Fetch blackspots along current route ----------
  const fetchRouteBlackspots = async (
    startCoords: { lng: number; lat: number },
    endCoords: { lng: number; lat: number }
  ) => {
    try {
      const res = await api.get<RouteBlackspotResponse>("/blackspots-route/", {
        params: {
          start_lng: startCoords.lng,
          start_lat: startCoords.lat,
          end_lng: endCoords.lng,
          end_lat: endCoords.lat,
          buffer_km: 1, // 1km corridor around the route
        },
      });

      setRouteSafety(res.data.summary);
      setRouteBlackspots(res.data.geojson);
      setInfoMsg(
        `Found ${res.data.summary.total_blackspots} blackspots along this route`
      );
    } catch (err) {
      console.error("Failed to fetch route blackspots:", err);
      setRouteSafety(null);
      setRouteBlackspots(null);
      setInfoMsg("Could not analyze blackspots along this route.");
    }
  };

  // -------- ROUTE HANDLER ----------
  const fetchRoute = async (mode: "fastest" | "safest") => {
    try {
      const startCoords = parseLngLat(start);
      const endCoords = parseLngLat(end);

      const res = await api.get("/route/", { params: { start, end, mode } });
      const route = res.data;

      const r: RouteInfo = {
        id: mode,
        geometry: route.routes[0].geometry,
        safety_score: route.safety_score,
        distance: route.routes[0].distance,
        duration: route.routes[0].duration,
      };

      const updated = [...routes.filter((x) => x.id !== mode), r];
      setRoutes(updated);

      if (updated.length === 2) {
        const best = updated.reduce((a, b) =>
          a.safety_score >= b.safety_score ? a : b
        );
        setRecommendedId(best.id);
      }

      drawRouteOnMap(r);

      // ⭐ AFTER we have a route, analyze blackspots along this path
      fetchRouteBlackspots(startCoords, endCoords);
    } catch (err) {
      console.error(err);
      setInfoMsg("Route fetch failed.");
    }
  };

  const drawRouteOnMap = (route: RouteInfo) => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = `route-${route.id}`;
    const layerId = `route-layer-${route.id}`;

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    map.addSource(sourceId, {
      type: "geojson",
      data: { type: "Feature", geometry: route.geometry, properties: {} },
    });

    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-width": route.id === recommendedId ? 6 : 4,
        "line-color":
          route.id === "fastest"
            ? "#888"
            : route.id === "safest"
            ? "#00ff00"
            : "#ff8800",
      },
    });

    const coords = route.geometry.coordinates;
    const bounds = new mapboxgl.LngLatBounds(
      coords[0] as [number, number],
      coords[0] as [number, number]
    );
    coords.forEach((c) => bounds.extend(c as [number, number]));
    map.fitBounds(bounds, { padding: 40 });
  };

  // -------- NEW: Show route-specific blackspots on map ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = "route-blackspots-source";
    const layerId = "route-blackspots-layer";

    if (!routeBlackspots) {
      // If no route blackspots, remove layer if exists
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      return;
    }

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: routeBlackspots,
      });
    } else {
      (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(
        routeBlackspots
      );
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            1,
            5,
            3,
            8,
            5,
            12,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            1,
            "#22c55e", // green
            3,
            "#eab308", // yellow
            5,
            "#ef4444", // red
          ],
          "circle-stroke-color": "#000000",
          "circle-stroke-width": 1,
          "circle-opacity": 0.95,
        },
      });

      map.on("click", layerId, (e: any) => {
        const feature = e.features[0];
        const props = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;

        new mapboxgl.Popup()
          .setLngLat([lng, lat])
          .setHTML(
            `
            <div style="font-size: 13px;">
              <strong>${props.name}</strong><br/>
              Severity: ${props.severity}<br/>
              Distance from route: ${props.distance_km} km
            </div>
          `.trim()
          )
          .addTo(map);
      });

      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }, [routeBlackspots]);

  // -------- INCIDENT REPORT (right-click) ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const reportHandler = (e: any) => {
      const { lng, lat } = e.lngLat;
      const description = prompt("Describe incident at this location");
      if (!description) return;

      api
        .post("/incident/", {
          incident_type: "DARK_ROAD",
          description,
          latitude: lat,
          longitude: lng,
        })
        .then(() => window.location.reload())
        .catch(() => alert("Failed to report incident"));
    };

    map.on("contextmenu", reportHandler);
    return () => map.off("contextmenu", reportHandler);
  }, []);

  // -------- SOS ----------
  const handleSOS = async () => {
    try {
      const [lngStr, latStr] = end.split(",");
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lngStr);

      await api.post("/sos/", { latitude, longitude });
      const text = encodeURIComponent(
        `SOS! Need help. Location: https://maps.google.com/?q=${latitude},${longitude}`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
    } catch {
      alert("SOS failed");
    }
  };

  // -------- SAFE POINTS ----------
  const handleSafePoints = async () => {
    try {
      const [lngStr, latStr] = end.split(",");
      const res = await api.get("/safe-points/", {
        params: { near: `${latStr},${lngStr}` },
      });

      setSafePoints(res.data.points || []);
      const map = mapRef.current;

      res.data.points.forEach((p: SafePoint) => {
        new mapboxgl.Marker({ color: "#38bdf8" })
          .setLngLat([p.longitude, p.latitude])
          .setPopup(
            new mapboxgl.Popup().setHTML(`<b>${p.name}</b><br>${p.type}`)
          )
          .addTo(map!);
      });
    } catch {
      alert("Failed safe points fetch");
    }
  };

  // -------- RENDER ----------
  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top controls */}
      <div className="absolute top-4 left-4 bg-slate-900/90 text-white px-4 py-3 rounded-xl shadow-lg space-y-2 w-80 border border-slate-700">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold">Knightlee</span>
          <button
            onClick={onLogout}
            className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
          >
            Logout
          </button>
        </div>

        <div className="space-y-1 text-xs">
          <div>
            <label className="block text-slate-300">Start (lng,lat)</label>
            <input
              className="w-full text-black text-xs px-1 py-1 rounded"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-300">End (lng,lat)</label>
            <input
              className="w-full text-black text-xs px-1 py-1 rounded"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => fetchRoute("fastest")}
            className="flex-1 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
          >
            Fastest Route
          </button>
          <button
            onClick={() => fetchRoute("safest")}
            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded"
          >
            Safest Route
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSafePoints}
            className="flex-1 text-xs bg-sky-600 hover:bg-sky-500 px-2 py-1 rounded"
          >
            Nearby Safe Points
          </button>
          <button
            onClick={handleSOS}
            className="flex-1 text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded"
          >
            SOS
          </button>
        </div>

        {infoMsg && (
          <div className="mt-2 text-[11px] text-slate-300">{infoMsg}</div>
        )}
      </div>

      {/* ⭐ Route Safety Card */}
      {routeSafety && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white px-4 py-3 rounded-xl shadow-lg w-80 space-y-2 border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Route Safety</span>
            <span
              className={`text-lg font-bold ${
                routeSafety.safety_percentage >= 80
                  ? "text-green-400"
                  : routeSafety.safety_percentage >= 50
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {routeSafety.safety_percentage}%
            </span>
          </div>

          <div className="text-xs text-slate-300">
            Distance: <strong>{routeSafety.route_distance_km} km</strong>
          </div>

          <div className="text-xs text-slate-300">
            Blackspots on route:{" "}
            <strong>{routeSafety.total_blackspots}</strong> (avg severity{" "}
            {routeSafety.avg_severity}, max {routeSafety.max_severity})
          </div>

          {routeSafety.min_distance_km !== null && (
            <div className="text-xs text-slate-300">
              Closest blackspot to route:{" "}
              <strong>{routeSafety.min_distance_km} km</strong>
            </div>
          )}

          <div className="w-full bg-slate-700 rounded-full h-2 mt-1 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                routeSafety.safety_percentage >= 80
                  ? "bg-green-400"
                  : routeSafety.safety_percentage >= 50
                  ? "bg-yellow-400"
                  : "bg-red-500"
              }`}
              style={{ width: `${routeSafety.safety_percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default KnightleeMap;
