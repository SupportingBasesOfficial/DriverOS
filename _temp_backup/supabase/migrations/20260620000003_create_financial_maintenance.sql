-- ============================================================================
-- MIGRATION: DriverOS - Financial and Maintenance
-- ============================================================================
-- Descricao: Refuelings, maintenances, vehicle_expenses, ride_apps, user_ride_apps
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE expense_category AS ENUM ('ipva', 'insurance', 'licensing', 'financing', 'rent', 'maintenance', 'fuel', 'other');
CREATE TYPE expense_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE expense_status AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'inspection', 'tire_change', 'oil_change', 'other');
CREATE TYPE maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- ============================================================================
-- TABELA: refuelings (Abastecimentos)
-- ============================================================================
CREATE TABLE refuelings (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liters NUMERIC(8,3) NOT NULL CHECK (liters > 0),
  total_cost NUMERIC(10,2) NOT NULL CHECK (total_cost > 0),
  price_per_liter NUMERIC(6,3) GENERATED ALWAYS AS (total_cost / liters) STORED,
  station_name TEXT,
  odometer_km NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE refuelings IS 'Registro de abastecimentos do veiculo.';

-- ============================================================================
-- TABELA: maintenances (Manutencoes)
-- ============================================================================
CREATE TABLE maintenances (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type maintenance_type NOT NULL,
  description TEXT,
  cost NUMERIC(10,2),
  odometer_km NUMERIC(10,2) NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_due_km NUMERIC(10,2),
  status maintenance_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE maintenances IS 'Historico e agendamento de manutencoes do veiculo.';

CREATE TRIGGER set_timestamp_maintenances
BEFORE UPDATE ON maintenances
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TABELA: vehicle_expenses (Contas fixas - IPVA, seguro, parcela, etc.)
-- ============================================================================
CREATE TABLE vehicle_expenses (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  frequency expense_frequency NOT NULL DEFAULT 'monthly',
  due_date DATE,
  status expense_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE vehicle_expenses IS 'Contas fixas do veiculo: IPVA, seguro, licenciamento, parcela, aluguel, etc.';

CREATE TRIGGER set_timestamp_vehicle_expenses
BEFORE UPDATE ON vehicle_expenses
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TABELA: ride_apps (Regras dos apps de corrida)
-- ============================================================================
CREATE TABLE ride_apps (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  min_vehicle_year INTEGER,
  max_vehicle_age INTEGER,
  requirements_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ride_apps IS 'Regras de cada app de corrida (Uber, 99, inDriver, etc.).';

-- Dados iniciais
INSERT INTO ride_apps (name, label, min_vehicle_year, max_vehicle_age) VALUES
  ('uber', 'Uber', 2010, 10),
  ('ninenine', '99', 2005, 15),
  ('indriver', 'inDriver', 2000, 20),
  ('cabify', 'Cabify', 2012, 8);

-- ============================================================================
-- TABELA: user_ride_apps (Vinculacao motorista <-> app)
-- ============================================================================
CREATE TABLE user_ride_apps (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_app_id UUID NOT NULL REFERENCES ride_apps(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ride_app_id)
);

COMMENT ON TABLE user_ride_apps IS 'Quais apps de corrida o motorista utiliza e com qual veiculo.';

-- ============================================================================
-- INDICES
-- ============================================================================
CREATE INDEX idx_refuelings_vehicle_id ON refuelings(vehicle_id);
CREATE INDEX idx_refuelings_user_id ON refuelings(user_id);
CREATE INDEX idx_maintenances_vehicle_id ON maintenances(vehicle_id);
CREATE INDEX idx_vehicle_expenses_vehicle_id ON vehicle_expenses(vehicle_id);
CREATE INDEX idx_user_ride_apps_user_id ON user_ride_apps(user_id);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE refuelings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ride_apps ENABLE ROW LEVEL SECURITY;

-- RLS: refuelings
CREATE POLICY "Dono ve seus abastecimentos"
  ON refuelings FOR ALL USING (user_id = auth.uid());

-- RLS: maintenances
CREATE POLICY "Dono ve manutencoes de seus veiculos"
  ON maintenances FOR ALL USING (EXISTS (
    SELECT 1 FROM vehicles v WHERE v.id = maintenances.vehicle_id AND v.user_id = auth.uid()
  ));

-- RLS: vehicle_expenses
CREATE POLICY "Dono ve despesas de seus veiculos"
  ON vehicle_expenses FOR ALL USING (EXISTS (
    SELECT 1 FROM vehicles v WHERE v.id = vehicle_expenses.vehicle_id AND v.user_id = auth.uid()
  ));

-- RLS: ride_apps (public read)
CREATE POLICY "Todos veem apps de corrida"
  ON ride_apps FOR SELECT USING (true);

-- RLS: user_ride_apps
CREATE POLICY "Dono gerencia seus apps"
  ON user_ride_apps FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
