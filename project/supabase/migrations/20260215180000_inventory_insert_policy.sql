-- Allow inserting new inventory items
DROP POLICY IF EXISTS "Anyone can create inventory" ON inventory;
CREATE POLICY "Anyone can create inventory"
  ON inventory FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
