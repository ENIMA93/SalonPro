-- Add email and user_id to staff for account linking
-- email: unique, required for staff who can log in
-- user_id: links to auth.users(id)

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS staff_email_key ON staff (email) WHERE email IS NOT NULL;

COMMENT ON COLUMN staff.email IS 'Login email; required when staff has an account';
COMMENT ON COLUMN staff.user_id IS 'Links to auth.users(id) for this staff member';
