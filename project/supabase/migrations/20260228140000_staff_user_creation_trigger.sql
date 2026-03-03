-- Create automatic user account creation for staff members
-- This replaces the Edge Function approach with a PostgreSQL trigger

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Only create user if email is provided and user_id is not already set
  IF NEW.email IS NOT NULL AND NEW.user_id IS NULL THEN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Generate a temporary password (will be replaced by the frontend)
    -- Format: Temp + 4 random digits + !
    temp_password := 'Temp' || (1000 + floor(random() * 9000)::int)::text || '!';
    
    -- Insert into the auth.users table
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
      NEW.email,
      crypt(temp_password, gen_salt('bf')), -- Hash the temporary password
      now(), -- Auto-confirm email so they can log in immediately
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', NEW.name, 'staff_id', NEW.id),
      now(),
      now(),
      'authenticated',
      ''
    );
    
    -- Update the staff record with the new user_id
    NEW.user_id := new_user_id;
    
    -- Create a profile record for the new user (profiles: id, role, staff_id, must_change_password only)
    INSERT INTO public.profiles (
      id,
      role,
      staff_id,
      must_change_password
    )
    VALUES (
      new_user_id,
      'staff',
      NEW.id,
      true
    );
    
    -- Log the temporary password (in production, you might want to handle this differently)
    RAISE NOTICE 'Created user account for staff member % with email % and temporary password %', 
      NEW.name, NEW.email, temp_password;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on the staff table
DROP TRIGGER IF EXISTS on_staff_created ON public.staff;
CREATE TRIGGER on_staff_created
  BEFORE INSERT ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_staff_user();

-- 3. Create a function to manually create user accounts for existing staff
CREATE OR REPLACE FUNCTION public.create_staff_user_account(
  staff_id_param uuid,
  email_param text
)
RETURNS jsonb AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
  staff_record record;
  result jsonb;
BEGIN
  -- Check if staff exists
  SELECT * INTO staff_record FROM public.staff WHERE id = staff_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Staff member not found');
  END IF;
  
  -- Check if staff already has a user account
  IF staff_record.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Staff member already has a user account');
  END IF;
  
  -- Generate credentials
  new_user_id := gen_random_uuid();
  temp_password := 'Temp' || (1000 + floor(random() * 9000)::int)::text || '!';
  
  -- Insert into auth.users
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
    email_param,
    crypt(temp_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', staff_record.name, 'staff_id', staff_record.id),
    now(),
    now(),
    'authenticated',
    ''
  );
  
  -- Update staff record
  UPDATE public.staff 
  SET email = email_param, user_id = new_user_id 
  WHERE id = staff_id_param;
  
  -- Create profile (profiles: id, role, staff_id, must_change_password only)
  INSERT INTO public.profiles (
    id,
    role,
    staff_id,
    must_change_password
  )
  VALUES (
    new_user_id,
    'staff',
    staff_id_param,
    true
  );
  
  -- Return success with credentials
  RETURN jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', email_param,
    'temporary_password', temp_password,
    'message', 'User account created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_staff_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_staff_user_account(uuid, text) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.handle_new_staff_user() IS 'Automatically creates auth.users and profiles records when staff with email is inserted';
COMMENT ON FUNCTION public.create_staff_user_account(uuid, text) IS 'Manually creates user account for existing staff member';