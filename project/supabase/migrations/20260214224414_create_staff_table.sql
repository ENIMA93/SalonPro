/*
  # Create Staff Table
  
  1. New Tables
    - `staff`
      - `id` (uuid, primary key)
      - `name` (text, staff member name)
      - `role` (text, position/role like "Stylist", "Manager")
      - `is_active` (boolean, active status)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `staff` table
    - Allow authenticated users to read staff data
*/

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view staff"
  ON staff FOR SELECT
  TO anon, authenticated
  USING (true);
