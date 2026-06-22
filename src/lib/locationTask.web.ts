import * as Location from "expo-location";
import { supabase } from "./supabase";

let watchSubscription: Location.LocationSubscription | null = null;
let currentTripId: string | null = null;

async function savePoint(tripId: string, loc: Location.LocationObject): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("locations") as any).insert({
      trip_id: tripId,
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      speed: loc.coords.speed ?? null,
      accuracy: loc.coords.accuracy ?? null,
      recorded_at: new Date(loc.timestamp).toISOString(),
    });
  } catch (e) {
    console.error("[locationTask.web] savePoint", e);
  }
}

function handleVisibilityChange(): void {
  if (typeof document === "undefined") return;
  if (document.hidden) {
    watchSubscription?.remove();
    watchSubscription = null;
  }
}

export async function startLocationTracking(tripId: string): Promise<void> {
  currentTripId = tripId;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") { console.warn("[locationTask.web] permission denied"); return; }
  watchSubscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20 },
    (loc) => { if (currentTripId) savePoint(currentTripId, loc); },
  );
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
}

export async function stopLocationTracking(): Promise<void> {
  currentTripId = null;
  watchSubscription?.remove();
  watchSubscription = null;
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
}
