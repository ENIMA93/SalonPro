-- Role-based RLS: admin full access, staff limited (Calendar, POS, Sales read + insert transactions, Clients read+insert+update).
-- Helper: current user's role from profiles (null if no profile).
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Revoke anon from all app tables (only authenticated users with profiles can access)
REVOKE ALL ON public.staff FROM anon;
REVOKE ALL ON public.services FROM anon;
REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.inventory FROM anon;
REVOKE ALL ON public.transactions FROM anon;
REVOKE ALL ON public.clients FROM anon;

-- ========== STAFF table: admin only ==========
DROP POLICY IF EXISTS "Anyone can view staff" ON public.staff;
DROP POLICY IF EXISTS "Anyone can insert staff" ON public.staff;
DROP POLICY IF EXISTS "Anyone can update staff" ON public.staff;
DROP POLICY IF EXISTS "Anyone can delete staff" ON public.staff;

CREATE POLICY "Admin full staff"
  ON public.staff FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ========== SERVICES table: admin only ==========
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Anyone can insert services" ON public.services;
DROP POLICY IF EXISTS "Anyone can update services" ON public.services;
DROP POLICY IF EXISTS "Anyone can delete services" ON public.services;

CREATE POLICY "Admin full services"
  ON public.services FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ========== APPOINTMENTS: admin full; staff select, insert, update ==========
DROP POLICY IF EXISTS "Anyone can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can update appointments" ON public.appointments;

CREATE POLICY "Admin full appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Staff read appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'staff');

CREATE POLICY "Staff insert appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'staff');

CREATE POLICY "Staff update appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'staff')
  WITH CHECK (public.current_user_role() = 'staff');

-- ========== TRANSACTIONS: admin full; staff select, insert (no delete) ==========
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can create transactions" ON public.transactions;

CREATE POLICY "Admin full transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Staff read transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'staff');

CREATE POLICY "Staff insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'staff');

-- Grant DELETE only to admin (covered by "Admin full"); staff has no DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;

-- ========== CLIENTS: admin full; staff select, insert, update ==========
DROP POLICY IF EXISTS "Anyone can view clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can update clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can delete clients" ON public.clients;

CREATE POLICY "Admin full clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Staff read clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'staff');

CREATE POLICY "Staff insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'staff');

CREATE POLICY "Staff update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'staff')
  WITH CHECK (public.current_user_role() = 'staff');

-- ========== INVENTORY: admin only ==========
DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anyone can create inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anyone can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anyone can delete inventory" ON public.inventory;

CREATE POLICY "Admin full inventory"
  ON public.inventory FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Ensure authenticated has table grants (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
