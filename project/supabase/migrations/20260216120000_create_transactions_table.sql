-- POS transactions: each row = one sale (cart snapshot + total)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  items_json jsonb NOT NULL DEFAULT '[]'
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transactions"
  ON transactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create transactions"
  ON transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.transactions TO anon, authenticated;
