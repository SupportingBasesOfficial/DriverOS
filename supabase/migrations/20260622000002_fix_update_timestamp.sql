-- ============================================================================
-- Migration: Fix update_timestamp() function
-- ============================================================================
-- The original function in initial_setup.sql sets NEW.atualizado_em,
-- but all tables (profiles, orgs, vehicles, shifts, trips...) use updated_at.
-- This causes "record 'new' has no field 'atualizado_em'" on every UPDATE.
-- Fix: replace the function body to set updated_at instead.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
