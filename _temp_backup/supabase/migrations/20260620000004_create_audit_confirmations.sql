-- ============================================================================
-- MIGRATION: DriverOS - Audit and Confirmations
-- ============================================================================
-- Descricao: Confirmacoes obrigatorias do usuario e snapshots do motorista
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE confirmation_type AS ENUM ('trip', 'refueling', 'maintenance', 'expense', 'shift');

-- ============================================================================
-- TABELA: confirmations (Confirmacoes obrigatorias do usuario)
-- ============================================================================
CREATE TABLE confirmations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  record_type confirmation_type NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmation_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE confirmations IS 
'Todo dado que entra no calculo financeiro precisa de confirmacao explicita do usuario. Auditavel e verificavel.';

-- ============================================================================
-- TABELA: driver_snapshots (Resumo diario/semanal/mensal do motorista)
-- ============================================================================
CREATE TABLE driver_snapshots (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(12,2) GENERATED ALWAYS AS (total_earnings - total_expenses) STORED,
  efficiency_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

COMMENT ON TABLE driver_snapshots IS 'Snapshot diario do desempenho do motorista para analise de longo prazo.';

-- ============================================================================
-- INDICES
-- ============================================================================
CREATE INDEX idx_confirmations_user_id ON confirmations(user_id);
CREATE INDEX idx_confirmations_record ON confirmations(record_type, record_id);
CREATE INDEX idx_driver_snapshots_user_id ON driver_snapshots(user_id);
CREATE INDEX idx_driver_snapshots_date ON driver_snapshots(snapshot_date);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS: confirmations
CREATE POLICY "Dono ve suas confirmacoes"
  ON confirmations FOR ALL USING (user_id = auth.uid());

-- RLS: driver_snapshots
CREATE POLICY "Dono ve seus snapshots"
  ON driver_snapshots FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admin da org ve snapshots da org"
  ON driver_snapshots FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.org_id = (SELECT org_id FROM profiles WHERE profiles.id = driver_snapshots.user_id)
    AND p.role IN ('admin', 'manager')
  ));

-- ============================================================================
-- FUNCAO: snapshot_daily_update()
-- Descricao: Atualiza o snapshot diario do motorista
-- ============================================================================
CREATE OR REPLACE FUNCTION snapshot_daily_update(p_user_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO driver_snapshots (user_id, snapshot_date, total_earnings, total_expenses, total_km)
  SELECT 
    p_user_id,
    p_date,
    COALESCE(SUM(t.fare_amount), 0),
    COALESCE((
      SELECT SUM(r.total_cost) FROM refuelings r 
      WHERE r.user_id = p_user_id AND DATE(r.created_at) = p_date
    ), 0) + COALESCE((
      SELECT SUM(m.cost) FROM maintenances m 
      JOIN vehicles v ON v.id = m.vehicle_id 
      WHERE v.user_id = p_user_id AND DATE(m.performed_at) = p_date
    ), 0) + COALESCE((
      SELECT SUM(ve.amount) FROM vehicle_expenses ve 
      JOIN vehicles v ON v.id = ve.vehicle_id 
      WHERE v.user_id = p_user_id AND ve.due_date = p_date AND ve.status = 'paid'
    ), 0),
    COALESCE(SUM(t.distance_km), 0)
  FROM trips t
  WHERE t.user_id = p_user_id AND DATE(t.started_at) = p_date AND t.status = 'completed'
  ON CONFLICT (user_id, snapshot_date) 
  DO UPDATE SET
    total_earnings = EXCLUDED.total_earnings,
    total_expenses = EXCLUDED.total_expenses,
    total_km = EXCLUDED.total_km,
    efficiency_score = CASE 
      WHEN EXCLUDED.total_km > 0 THEN (EXCLUDED.net_profit / EXCLUDED.total_km) 
      ELSE 0 
    END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION snapshot_daily_update(UUID, DATE) IS 
'Atualiza o snapshot diario do motorista com base em corridas, abastecimentos, manutencoes e despesas.';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
