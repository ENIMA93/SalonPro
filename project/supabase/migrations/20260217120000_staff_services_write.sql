-- Allow anon/authenticated to insert, update, delete on staff and services (for app CRUD)

-- Staff
DROP POLICY IF EXISTS "Anyone can insert staff" ON staff;
CREATE POLICY "Anyone can insert staff"
  ON staff FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update staff" ON staff;
CREATE POLICY "Anyone can update staff"
  ON staff FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete staff" ON staff;
CREATE POLICY "Anyone can delete staff"
  ON staff FOR DELETE
  TO anon, authenticated
  USING (true);

GRANT INSERT, UPDATE, DELETE ON public.staff TO anon, authenticated;

-- Services
DROP POLICY IF EXISTS "Anyone can insert services" ON services;
CREATE POLICY "Anyone can insert services"
  ON services FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update services" ON services;
CREATE POLICY "Anyone can update services"
  ON services FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete services" ON services;
CREATE POLICY "Anyone can delete services"
  ON services FOR DELETE
  TO anon, authenticated
  USING (true);

GRANT INSERT, UPDATE, DELETE ON public.services TO anon, authenticated;
