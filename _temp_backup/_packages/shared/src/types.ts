import type { TRIP_CATEGORIES, STOP_REASONS, EXPENSE_CATEGORIES, EXPENSE_FREQUENCIES } from "./constants";

export type TripCategory = (typeof TRIP_CATEGORIES)[number];
export type StopReason = (typeof STOP_REASONS)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpenseFrequency = (typeof EXPENSE_FREQUENCIES)[number];

export interface LocationPoint {
  latitude: number;
  longitude: number;
  speed: number | null;
  accuracy: number | null;
  recordedAt: string;
}

export interface TripSummary {
  id: string;
  category: TripCategory;
  startLocation: { latitude: number; longitude: number } | null;
  endLocation: { latitude: number; longitude: number } | null;
  distanceKm: number;
  estimatedDistanceKm: number | null;
  fareAmount: number | null;
  startedAt: string;
  endedAt: string | null;
}

export interface ShiftSummary {
  id: string;
  startedAt: string;
  endedAt: string | null;
  initialOdometerKm: number;
  finalOdometerKm: number | null;
  totalDistanceKm: number;
  totalEarnings: number;
  tripCount: number;
}
