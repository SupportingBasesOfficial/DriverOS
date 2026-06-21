-- ============================================================================
-- MIGRATION: DriverOS - Multi-tenant Core
-- ============================================================================
-- Descrição: Orgs, profiles, vehicles e componentes de desgaste
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'driver', 'viewer');
CREATE TYPE vehicle_status AS ENUM ('active', 'inactive', 'sold', 'retired');
CREATE TYPE fuel_type AS ENUM ('gasoline', 'ethanol', 'diesel', 'flex', 'electric', 'hybrid');
CREATE TYPE component_status AS ENUM ('good', 'warning', 'critical', 'replaced');

-- ============================================================================
-- TABELA: orgs (Multi-tenancy - B2C = NULL, B2B = preenchido)
-- ============================================================================
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE orgs IS 'Organizacoes para multi-tenancy. B2C (motoristas individuais) usam org_id NULL.';

-- Trigger de timestamp
CREATE TRIGGER set_timestamp_orgs
BEFORE UPDATE ON orgs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TABELA: profiles (Extensao do auth.users do Supabase)
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'driver',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfil do usuario. Sincronizado com auth.users do Supabase.';

-- Trigger de timestamp
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TABELA: vehicles (Veiculos do motorista)
-- ============================================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= extract(year from now()) + 1),
  plate TEXT NOT NULL,
  current_odometer_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  fuel_type fuel_type NOT NULL DEFAULT 'flex',
  status vehicle_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE vehicles IS 'Cadastro de veiculos do motorista.';

-- Trigger de timestamp
CREATE TRIGGER set_timestamp_vehicles
BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TABELA: vehicle_components (Desgaste natural - pastilha, oleo, pneus, etc.)
-- ============================================================================
CREATE TABLE vehicle_components (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  lifespan_km NUMERIC(10,2) NOT NULL,
  installed_at_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2),
  last_replaced_at TIMESTAMPTZ,
  status component_status NOT NULL DEFAULT 'good',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE vehicle_components IS 'Componentes de desgaste natural do veiculo para projecao de custo.';

-- Trigger de timestamp
CREATE TRIGGER set_timestamp_vehicle_components
BEFORE UPDATE ON vehicle_components
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- RLS - Row Level Security
-- ============================================================================

-- Enable RLS
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_components ENABLE ROW LEVEL SECURITY;

-- RLS: orgs
CREATE POLICY "Admins veem todas as orgs"
  ON orgs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Members veem sua propria org"
  ON orgs FOR SELECT
  USING (id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid()));

-- RLS: profiles
CREATE POLICY "Users veem seu proprio perfil"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users atualizam seu proprio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins veem todos os profiles"
  ON profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- RLS: vehicles
CREATE POLICY "Dono ve seus veiculos"
  ON vehicles FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admin da org ve todos os veiculos"
  ON vehicles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.org_id = vehicles.org_id 
    AND p.role IN ('admin', 'manager')
  ));

-- RLS: vehicle_components
CREATE POLICY "Dono ve componentes de seus veiculos"
  ON vehicle_components FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vehicles v WHERE v.id = vehicle_components.vehicle_id AND v.user_id = auth.uid()
  ));

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
