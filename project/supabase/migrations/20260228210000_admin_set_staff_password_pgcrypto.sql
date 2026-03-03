-- Fix: use extensions schema for pgcrypto (gen_salt/crypt) so admin_set_staff_password works
CREATE OR REPLACE FUNCTION public.admin_set_staff_password(
  new_password text,
  target_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  caller_role text;
BEGIN
  IF new_password IS NULL OR length(new_password) < 8 THEN
    RETURN jsonb_build_object('error', 'Password must be at least 8 characters');
  END IF;

  caller_role := public.current_user_role();
  IF caller_role IS NULL OR caller_role <> 'admin' THEN
    RETURN jsonb_build_object('error', 'Only admins can reset staff passwords');
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  UPDATE public.profiles
  SET must_change_password = true
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Password updated. Staff will be prompted to change it on next login.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
