-- Fix: auth.users token columns must be '' not NULL so GoTrue login works (supabase/auth#1940)

CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  IF NEW.email IS NOT NULL AND NEW.user_id IS NULL THEN
    new_user_id := gen_random_uuid();
    temp_password := 'Temp' || (1000 + floor(random() * 9000)::int)::text || '!';

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      NEW.email,
      crypt(temp_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', NEW.name, 'staff_id', NEW.id),
      now(), now(),
      '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      new_user_id, new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', NEW.email),
      'email', new_user_id::text, now(), now(), now()
    );

    NEW.user_id := new_user_id;

    INSERT INTO public.profiles (id, role, staff_id, must_change_password)
    VALUES (new_user_id, 'staff', NEW.id, true);

    RAISE NOTICE 'Created user account for staff member % with email %', NEW.name, NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_staff_user_account(
  staff_id_param uuid,
  email_param text
)
RETURNS jsonb AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
  staff_record record;
BEGIN
  SELECT * INTO staff_record FROM public.staff WHERE id = staff_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Staff member not found');
  END IF;
  IF staff_record.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Staff member already has a user account');
  END IF;

  new_user_id := gen_random_uuid();
  temp_password := 'Temp' || (1000 + floor(random() * 9000)::int)::text || '!';

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    email_param,
    crypt(temp_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', staff_record.name, 'staff_id', staff_record.id),
    now(), now(),
    '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    new_user_id, new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', email_param),
    'email', new_user_id::text, now(), now(), now()
  );

  UPDATE public.staff SET email = email_param, user_id = new_user_id WHERE id = staff_id_param;

  INSERT INTO public.profiles (id, role, staff_id, must_change_password)
  VALUES (new_user_id, 'staff', staff_id_param, true);

  RETURN jsonb_build_object(
    'success', true, 'user_id', new_user_id, 'email', email_param,
    'temporary_password', temp_password, 'message', 'User account created successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    trim(email_param),
    crypt(password_param, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', trim(name_param), 'staff_id', new_staff_id),
    now(), now(),
    '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    new_user_id, new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', trim(email_param)),
    'email', new_user_id::text, now(), now(), now()
  );

  INSERT INTO public.staff (id, name, role, email, user_id, is_active)
  VALUES (
    new_staff_id, trim(name_param), trim(role_param), trim(email_param),
    new_user_id, COALESCE(is_active_param, true)
  );

  INSERT INTO public.profiles (id, role, staff_id, must_change_password)
  VALUES (new_user_id, 'staff', new_staff_id, true);

  RETURN jsonb_build_object(
    'success', true, 'id', new_staff_id, 'user_id', new_user_id,
    'name', trim(name_param), 'role', trim(role_param), 'email', trim(email_param),
    'is_active', COALESCE(is_active_param, true), 'temporary_password', password_param
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
