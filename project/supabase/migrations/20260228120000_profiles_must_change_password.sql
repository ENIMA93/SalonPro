-- Staff created with a temporary password must change it on first login.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.must_change_password IS 'When true, user is shown change-password screen after login (e.g. new staff with temp password).';

-- Allow user to clear the flag after they have changed their password (client calls auth.updateUser then this).
CREATE OR REPLACE FUNCTION public.set_password_changed()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET must_change_password = false
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.set_password_changed() TO authenticated;
