-- ============================================================================
-- Migration: add installment-tracking columns to vehicle_expenses
-- Allows full control over parceled expenses (financing, insurance, etc.)
-- ============================================================================

ALTER TABLE vehicle_expenses
  ADD COLUMN IF NOT EXISTS installment_count  INTEGER,
  ADD COLUMN IF NOT EXISTS installments_paid  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS installment_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_amount       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS due_day            INTEGER CHECK (due_day BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS due_month          INTEGER CHECK (due_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS started_at         DATE;

-- Constraint: installments_paid cannot exceed installment_count
ALTER TABLE vehicle_expenses
  ADD CONSTRAINT chk_installments_paid
    CHECK (installment_count IS NULL OR installments_paid <= installment_count);
