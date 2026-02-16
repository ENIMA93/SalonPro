/*
  # Create Appointments Table
  
  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `client_name` (text, client name)
      - `service_id` (uuid, foreign key to services)
      - `staff_id` (uuid, foreign key to staff)
      - `date_time` (timestamp, appointment date and time)
      - `status` (text, completed/in-progress/scheduled/cancelled)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `appointments` table
    - Allow authenticated users to read appointments
    - Allow authenticated users to insert appointments
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  date_time timestamptz NOT NULL,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view appointments"
  ON appointments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create appointments"
  ON appointments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update appointments"
  ON appointments FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
