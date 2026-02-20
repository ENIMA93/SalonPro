-- Allow anon/authenticated to insert, update, delete on staff and services (for app CRUD)

-- Staff
CREATE POLICY "Anyone can insert staff"
  ON staff FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update staff"
  ON staff FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete staff"
  ON staff FOR DELETE
  TO anon, authenticated
  USING (true);

GRANT INSERT, UPDATE, DELETE ON public.staff TO anon, authenticated;

-- Services
CREATE POLICY "Anyone can insert services"
  ON services FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update services"
  ON services FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete services"
  ON services FOR DELETE
  TO anon, authenticated
  USING (true);

GRANT INSERT, UPDATE, DELETE ON public.services TO anon, authenticated;
