-- Allow inserting new inventory items
CREATE POLICY "Anyone can create inventory"
  ON inventory FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
