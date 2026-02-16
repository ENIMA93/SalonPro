/*
  # Create Services Table
  
  1. New Tables
    - `services`
      - `id` (uuid, primary key)
      - `name` (text, service name)
      - `duration_min` (integer, duration in minutes)
      - `price` (numeric, service price)
      - `gender_category` (text, target gender or "all")
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `services` table
    - Allow authenticated users to read services
*/

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_min integer NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  gender_category text DEFAULT 'all',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  TO anon, authenticated
  USING (true);
