-- ============================================================================
-- Migration: Fix RLS infinite recursion
-- ============================================================================
-- Remove all admin/org policies that reference `profiles` from within another
-- table's policy. These cause infinite recursion because the profiles SELECT
-- policy triggers a new profiles query, which triggers the policy again.
-- These are B2B features — not needed for the B2C individual driver app.
-- ============================================================================

-- profiles: recursive self-referencing admin policy
DROP POLICY IF EXISTS "Admins veem todos os profiles" ON profiles;

-- orgs: both policies reference profiles
DROP POLICY IF EXISTS "Admins veem todas as orgs" ON orgs;
DROP POLICY IF EXISTS "Members veem sua propria org" ON orgs;

-- vehicles: admin policy joins profiles
DROP POLICY IF EXISTS "Admin da org ve todos os veiculos" ON vehicles;

-- shifts: admin policy joins profiles
DROP POLICY IF EXISTS "Admin da org ve shifts da org" ON shifts;

-- trips: admin policy joins profiles
DROP POLICY IF EXISTS "Admin da org ve trips da org" ON trips;

-- driver_snapshots: admin policy references profiles twice
DROP POLICY IF EXISTS "Admin da org ve snapshots da org" ON driver_snapshots;
