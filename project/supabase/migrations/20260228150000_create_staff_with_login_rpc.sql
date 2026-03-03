-- RPC to create staff + auth user in one go with the chosen password (so UI can show correct password)
CREATE OR REPLACE FUNCTION public.create_staff_with_login(
  name_param text,
  role_param text,
  email_param text,
  password_param text,
  is_active_param boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  new_user_id uuid;
  new_staff_id uuid;
  result jsonb;
BEGIN
  IF name_param IS NULL OR trim(name_param) = '' THEN
    RETURN jsonb_build_object('error', 'Name is required');
  END IF;
  IF email_param IS NULL OR trim(email_param) = '' THEN
    RETURN jsonb_build_object('error', 'Email is required');
  END IF;
  IF password_param IS NULL OR length(password_param) < 8 THEN
    RETURN jsonb_build_object('error', 'Password must be at least 8 characters');
  END IF;

  new_user_id := gen_random_uuid();
  new_staff_id := gen_random_uuid();

  -- Create auth user with the password chosen by the admin
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    confirmation_token
  )
  VALUES (
    new_user_id,
    trim(email_param),
    crypt(password_param, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', trim(name_param), 'staff_id', new_staff_id),
    now(),
    now(),
    'authenticated',
    ''
  );

  -- Create profile (profiles table: id, role, staff_id, must_change_password only)
  INSERT INTO public.profiles (
    id,
    role,
    staff_id,
    must_change_password
  )
  VALUES (
    new_user_id,
    'staff',
    new_staff_id,
    true
  );

  -- Insert staff with user_id set so the BEFORE INSERT trigger does not run (user_id is not null)
  INSERT INTO public.staff (
    id,
    name,
    role,
    email,
    user_id,
    is_active
  )
  VALUES (
    new_staff_id,
    trim(name_param),
    trim(role_param),
    trim(email_param),
    new_user_id,
    COALESCE(is_active_param, true)
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', new_staff_id,
    'user_id', new_user_id,
    'name', trim(name_param),
    'role', trim(role_param),
    'email', trim(email_param),
    'is_active', COALESCE(is_active_param, true),
    'temporary_password', password_param
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_staff_with_login(text, text, text, text, boolean) TO authenticated;
COMMENT ON FUNCTION public.create_staff_with_login(text, text, text, text, boolean) IS 'Create staff member with login using the provided password; returns staff and password for UI';