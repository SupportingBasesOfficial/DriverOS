/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";

interface RouteMapProps {
  startLocation: { latitude: number; longitude: number } | null;
  endLocation: { latitude: number; longitude: number } | null;
  routeGeoJSON: object | null;
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export default function RouteMap({ startLocation, endLocation, routeGeoJSON }: RouteMapProps) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!startLocation && !endLocation) return;
    if (!containerRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css";
    document.head.appendChild(link);

    const center = startLocation ?? endLocation!;

    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (!containerRef.current || mapRef.current) return;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: [center.longitude, center.latitude],
        zoom: 14,
        attributionControl: false,
      });
      mapRef.current = map;

      map.on("load", () => {
        if (routeGeoJSON) {
          map.addSource("route", { type: "geojson", data: routeGeoJSON as any });
          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#3b82f6", "line-width": 5, "line-opacity": 0.9 },
          });
          const gj = routeGeoJSON as { geometry: { coordinates: [number, number][] } };
          if (gj.geometry?.coordinates?.length >= 2) {
            const lngs = gj.geometry.coordinates.map((c: [number, number]) => c[0]);
            const lats = gj.geometry.coordinates.map((c: [number, number]) => c[1]);
            map.fitBounds(
              [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
              { padding: 80, duration: 800 },
            );
          }
        } else if (startLocation && endLocation) {
          map.fitBounds(
            [
              [Math.min(startLocation.longitude, endLocation.longitude), Math.min(startLocation.latitude, endLocation.latitude)],
              [Math.max(startLocation.longitude, endLocation.longitude), Math.max(startLocation.latitude, endLocation.latitude)],
            ],
            { padding: 80, duration: 800 },
          );
        }
        if (startLocation) {
          new maplibregl.Marker({ color: "#22c55e" })
            .setLngLat([startLocation.longitude, startLocation.latitude])
            .addTo(map);
        }
        if (endLocation) {
          new maplibregl.Marker({ color: "#ef4444" })
            .setLngLat([endLocation.longitude, endLocation.latitude])
            .addTo(map);
        }
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      if (document.head.contains(link)) document.head.removeChild(link);
    };
  }, [startLocation, endLocation, routeGeoJSON]);

  if (!startLocation && !endLocation) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1e293b", padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 36 }}>📍</Text>
        <Text style={{ color: "#94a3b8", textAlign: "center", fontSize: 15 }}>Sem dados de GPS para esta viagem</Text>
      </View>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
