-- Add optional client and staff to transactions for detailed sales history
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES staff(id);

COMMENT ON COLUMN transactions.client_name IS 'Client name if provided at POS; null = Walk-in';
COMMENT ON COLUMN transactions.staff_id IS 'Staff member who handled this sale';
