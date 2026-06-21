-- ============================================================================
-- Migration: patch profiles RLS, auto-create trigger, snapshot fix
-- ============================================================================

-- 1. Trigger: auto-cria profile ao registrar novo usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'driver'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. RLS: policy INSERT para profiles
DROP POLICY IF EXISTS "Users inserem seu proprio perfil" ON profiles;
CREATE POLICY "Users inserem seu proprio perfil"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- 3. Backfill: profiles para usuários existentes sem row
INSERT INTO public.profiles (id, role)
SELECT u.id, 'driver'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Fix snapshot_daily_update: remove referência a EXCLUDED.net_profit
--    (coluna GENERATED ALWAYS — inválida em ON CONFLICT DO UPDATE)
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
    total_earnings   = EXCLUDED.total_earnings,
    total_expenses   = EXCLUDED.total_expenses,
    total_km         = EXCLUDED.total_km,
    efficiency_score = CASE
      WHEN EXCLUDED.total_km > 0
      THEN (EXCLUDED.total_earnings - EXCLUDED.total_expenses) / EXCLUDED.total_km
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
