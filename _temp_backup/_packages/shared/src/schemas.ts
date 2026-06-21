import { z } from "zod";

export const tripCategorySchema = z.enum([
  "passenger_pickup",
  "passenger_dropoff",
  "repositioning",
  "refueling",
  "personal",
  "unpaid_detour",
]);

export const stopReasonSchema = z.enum([
  "arrived",
  "traffic_light",
  "traffic",
  "quick_stop",
]);

export const expenseCategorySchema = z.enum([
  "ipva",
  "insurance",
  "licensing",
  "financing",
  "rent",
  "maintenance",
  "fuel",
  "other",
]);

export const expenseFrequencySchema = z.enum([
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const vehicleSchema = z.object({
  brand: z.string().min(1, "Marca obrigatória"),
  model: z.string().min(1, "Modelo obrigatório"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  plate: z.string().min(1, "Placa obrigatória"),
  currentOdometerKm: z.number().nonnegative(),
  fuelType: z.enum(["gasoline", "ethanol", "diesel", "flex", "electric", "hybrid"]),
});

export const tripConfirmationSchema = z.object({
  tripId: z.string().uuid(),
  fareAmount: z.number().nonnegative().optional(),
  distanceKm: z.number().positive(),
  estimatedDistanceKm: z.number().positive().optional(),
  confirmedAt: z.string().datetime(),
});

export const refuelingSchema = z.object({
  liters: z.number().positive(),
  totalCost: z.number().positive(),
  odometerKm: z.number().nonnegative(),
  stationName: z.string().optional(),
});
