-- ============================================================================
-- MIGRATION: DriverOS - Tracking Core
-- ============================================================================
-- Descrição: Shifts, trips, trip_categories e locations (rastro GPS)
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE trip_category AS ENUM (
  'passenger_pickup',
  'passenger_dropoff',
  'repositioning',
  'refueling',
  'personal',
  'unpaid_detour'
);

CREATE TYPE trip_status AS ENUM ('in_progress', 'completed', 'cancelled');
CREATE TYPE shift_status AS ENUM ('active', 'completed', 'cancelled');

-- ============================================================================
-- TABELA: shifts (Expedientes do motorista)
-- ============================================================================
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  initial_odometer_km NUMERIC(10,2) NOT NULL,
  final_odometer_km NUMERIC(10,2),
  status shift_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shifts IS 'Expedientes de trabalho do motorista. Um shift contem varias trips.';

CREATE TRIGGER set_timestamp_shifts
BEFORE UPDATE ON shifts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TABELA: trips (Viagens/rotas categorizadas)
-- ============================================================================
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category trip_category NOT NULL,
  status trip_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  start_location JSONB,
  end_location JSONB,
  distance_km NUMERIC(10,2),
  estimated_distance_km NUMERIC(10,2),
  fare_amount NUMERIC(10,2),
  app_name TEXT,
  route_geojson JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE trips IS 'Viagens categorizadas: corridas, reposicionamento, abastecimento, etc.';

CREATE TRIGGER set_timestamp_trips
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TABELA: locations (Pontos GPS granulares)
-- ============================================================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  latitude NUMERIC(12,8) NOT NULL,
  longitude NUMERIC(12,8) NOT NULL,
  speed NUMERIC(6,2),
  accuracy NUMERIC(6,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE locations IS 'Pontos GPS a cada 5-10s durante o movimento. GeoJSON para rota completa.';

-- ============================================================================
-- INDICES
-- ============================================================================
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_vehicle_id ON shifts(vehicle_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_trips_shift_id ON trips(shift_id);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_category ON trips(category);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_locations_trip_id ON locations(trip_id);
CREATE INDEX idx_locations_recorded_at ON locations(recorded_at);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS: shifts
CREATE POLICY "Dono ve seus shifts"
  ON shifts FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admin da org ve shifts da org"
  ON shifts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vehicles v
    JOIN profiles p ON p.id = auth.uid()
    WHERE v.id = shifts.vehicle_id AND v.org_id = p.org_id AND p.role IN ('admin', 'manager')
  ));

-- RLS: trips
CREATE POLICY "Dono ve suas trips"
  ON trips FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admin da org ve trips da org"
  ON trips FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vehicles v
    JOIN profiles p ON p.id = auth.uid()
    WHERE v.id = trips.vehicle_id AND v.org_id = p.org_id AND p.role IN ('admin', 'manager')
  ));

-- RLS: locations
CREATE POLICY "Dono ve locations de suas trips"
  ON locations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM trips t WHERE t.id = locations.trip_id AND t.user_id = auth.uid()
  ));

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
