-- Allow updating and deleting inventory items (for Edit/Delete on Inventory page)
CREATE POLICY "Anyone can update inventory"
  ON inventory FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete inventory"
  ON inventory FOR DELETE
  TO anon, authenticated
  USING (true);
