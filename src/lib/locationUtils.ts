export type LocationPoint = {
  latitude: number;
  longitude: number;
};

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function totalDistanceKm(points: LocationPoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(
      points[i - 1].latitude, points[i - 1].longitude,
      points[i].latitude, points[i].longitude,
    );
  }
  return Math.round(total * 100) / 100;
}

export function buildRouteGeoJSON(points: LocationPoint[]): object {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: points.map(p => [p.longitude, p.latitude]),
    },
    properties: {},
  };
}
