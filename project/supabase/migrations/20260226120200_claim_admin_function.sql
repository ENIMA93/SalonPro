-- First admin: when no profiles exist, the current user can claim admin.
-- Run from frontend once after creating the first user in Supabase Dashboard (Auth -> Users -> Add user).

CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
    RETURN; -- already have at least one profile, do nothing
  END IF;
  INSERT INTO public.profiles (id, role, staff_id)
  VALUES (auth.uid(), 'admin', NULL)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;
