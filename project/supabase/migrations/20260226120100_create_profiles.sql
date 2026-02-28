/*
  # Profiles (app role store)
  - id: auth.users(id)
  - role: 'admin' | 'staff'
  - staff_id: for staff, references staff.id
  First admin: create user in Dashboard, then run claim_admin() once after first login
  (or use seed script with service role to insert into profiles).
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'staff')),
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Only admins can insert/update profiles (handled via claim_admin and Edge Function)
-- For claim_admin we need a policy that allows insert when no profiles exist; we use a function with SECURITY DEFINER
GRANT SELECT ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
