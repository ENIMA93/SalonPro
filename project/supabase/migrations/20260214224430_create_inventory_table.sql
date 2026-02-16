/*
  # Create Inventory Table
  
  1. New Tables
    - `inventory`
      - `id` (uuid, primary key)
      - `product_name` (text, product name)
      - `stock_count` (integer, quantity in stock)
      - `price` (numeric, product price)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `inventory` table
    - Allow authenticated users to read inventory
*/

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  stock_count integer DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory"
  ON inventory FOR SELECT
  TO anon, authenticated
  USING (true);
