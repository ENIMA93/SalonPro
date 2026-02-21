/*
  # Create Clients Table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text, optional)
      - `email` (text, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow anon/authenticated to select, insert, update, delete
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clients"
  ON clients FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert clients"
  ON clients FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update clients"
  ON clients FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete clients"
  ON clients FOR DELETE
  TO anon, authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO anon, authenticated;
