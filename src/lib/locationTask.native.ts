import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const LOCATION_TASK = "driveros-location-task";

// Must be defined at module top level — fires in background even when app is minimized
// eslint-disable-next-line @typescript-eslint/no-explicit-any
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) { console.error("[locationTask]", error.message); return; }
  if (!data) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  try {
    const tripId = await AsyncStorage.getItem("activeTripId");
    if (!tripId) return;
    await supabase.from("locations").insert(
      locations.map(l => ({
        trip_id: tripId,
        latitude: l.coords.latitude,
        longitude: l.coords.longitude,
        speed: l.coords.speed ?? null,
        accuracy: l.coords.accuracy ?? null,
        recorded_at: new Date(l.timestamp).toISOString(),
      })),
    );
  } catch (e) {
    console.error("[locationTask] save failed", e);
  }
});

export async function startLocationTracking(tripId: string): Promise<void> {
  await AsyncStorage.setItem("activeTripId", tripId);
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== "granted") { console.warn("[locationTask] foreground permission denied"); return; }
  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== "granted") console.warn("[locationTask] background permission denied — foreground only");
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (!isRunning) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,
      distanceInterval: 30,
      foregroundService: {
        notificationTitle: "DriverOS",
        notificationBody: "Rastreando sua viagem...",
        notificationColor: "#3b82f6",
      },
    });
  }
}

export async function stopLocationTracking(): Promise<void> {
  await AsyncStorage.removeItem("activeTripId");
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
    if (isRunning) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch (e) {
    console.error("[stopLocationTracking]", e);
  }
}
