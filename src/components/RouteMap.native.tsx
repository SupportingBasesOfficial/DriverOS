import { StyleSheet, Text, View } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";

MapLibreGL.setAccessToken(null);

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

interface RouteMapProps {
  startLocation: { latitude: number; longitude: number } | null;
  endLocation: { latitude: number; longitude: number } | null;
  routeGeoJSON: object | null;
}

export default function RouteMap({ startLocation, endLocation, routeGeoJSON }: RouteMapProps) {
  if (!startLocation && !endLocation) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 36 }}>📍</Text>
        <Text style={styles.emptyText}>Sem dados de GPS para esta viagem</Text>
      </View>
    );
  }

  const center = startLocation ?? endLocation!;

  const coords: [number, number][] = routeGeoJSON
    ? (routeGeoJSON as { geometry: { coordinates: [number, number][] } }).geometry.coordinates
    : [
        ...(startLocation ? [[startLocation.longitude, startLocation.latitude] as [number, number]] : []),
        ...(endLocation ? [[endLocation.longitude, endLocation.latitude] as [number, number]] : []),
      ];

  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  const hasBounds = coords.length >= 2;

  return (
    <MapLibreGL.MapView
      style={styles.map}
      styleURL={STYLE_URL}
      logoEnabled={false}
      attributionEnabled={false}
    >
      {hasBounds ? (
        <MapLibreGL.Camera
          bounds={{
            ne: [Math.max(...lngs) + 0.002, Math.max(...lats) + 0.002],
            sw: [Math.min(...lngs) - 0.002, Math.min(...lats) - 0.002],
            paddingTop: 60,
            paddingBottom: 140,
            paddingLeft: 30,
            paddingRight: 30,
          }}
          animationMode="flyTo"
          animationDuration={800}
        />
      ) : (
        <MapLibreGL.Camera
          centerCoordinate={[center.longitude, center.latitude]}
          zoomLevel={15}
          animationMode="flyTo"
          animationDuration={800}
        />
      )}

      {routeGeoJSON && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <MapLibreGL.ShapeSource id="route" shape={routeGeoJSON as any}>
          <MapLibreGL.LineLayer
            id="routeLine"
            style={{
              lineColor: "#3b82f6",
              lineWidth: 5,
              lineOpacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </MapLibreGL.ShapeSource>
      )}

      {startLocation && (
        <MapLibreGL.PointAnnotation
          id="markerStart"
          coordinate={[startLocation.longitude, startLocation.latitude]}
        >
          <View style={styles.markerStart}>
            <Text style={styles.markerText}>A</Text>
          </View>
        </MapLibreGL.PointAnnotation>
      )}

      {endLocation && (
        <MapLibreGL.PointAnnotation
          id="markerEnd"
          coordinate={[endLocation.longitude, endLocation.latitude]}
        >
          <View style={styles.markerEnd}>
            <Text style={styles.markerText}>B</Text>
          </View>
        </MapLibreGL.PointAnnotation>
      )}
    </MapLibreGL.MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
    padding: 24,
    gap: 12,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    fontSize: 15,
  },
  markerStart: {
    width: 28,
    height: 28,
    backgroundColor: "#22c55e",
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  markerEnd: {
    width: 28,
    height: 28,
    backgroundColor: "#ef4444",
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
