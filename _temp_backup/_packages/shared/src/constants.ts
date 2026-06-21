// Constantes compartilhadas entre web e mobile

export const TRIP_CATEGORIES = [
  "passenger_pickup",
  "passenger_dropoff",
  "repositioning",
  "refueling",
  "personal",
  "unpaid_detour",
] as const;

export const STOP_REASONS = [
  "arrived",
  "traffic_light",
  "traffic",
  "quick_stop",
] as const;

export const VEHICLE_COMPONENTS = [
  { name: "brake_pads", label: "Pastilhas de Freio", lifespanKm: 40000 },
  { name: "engine_oil", label: "Óleo do Motor", lifespanKm: 10000 },
  { name: "tires", label: "Pneus", lifespanKm: 50000 },
  { name: "air_filter", label: "Filtro de Ar", lifespanKm: 15000 },
  { name: "cabin_filter", label: "Filtro de Cabine", lifespanKm: 20000 },
  { name: "spark_plugs", label: "Velas de Ignição", lifespanKm: 30000 },
  { name: "timing_belt", label: "Correia Dentada", lifespanKm: 60000 },
  { name: "battery", label: "Bateria", lifespanKm: 50000 },
] as const;

export const EXPENSE_CATEGORIES = [
  "ipva",
  "insurance",
  "licensing",
  "financing",
  "rent",
  "maintenance",
  "fuel",
  "other",
] as const;

export const EXPENSE_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export const RIDE_APPS = [
  { name: "uber", label: "Uber", maxVehicleAge: 10, minVehicleYear: 2010 },
  { name: "ninenine", label: "99", maxVehicleAge: 15, minVehicleYear: 2005 },
  { name: "indriver", label: "inDriver", maxVehicleAge: 20, minVehicleYear: 2000 },
] as const;
