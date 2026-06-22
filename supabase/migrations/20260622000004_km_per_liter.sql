-- Add km_per_liter to refuelings for automatic fuel efficiency tracking
ALTER TABLE refuelings
  ADD COLUMN IF NOT EXISTS km_per_liter NUMERIC(8,2);
