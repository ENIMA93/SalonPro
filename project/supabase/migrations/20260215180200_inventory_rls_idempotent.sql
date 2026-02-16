-- Idempotent: RLS policies + table GRANTs for inventory (fixes "new row violates row-level security policy").
-- Supabase requires BOTH policies and GRANTs. Run this entire file in Supabase SQL Editor.

-- 1) Table-level GRANTs (required for anon/authenticated to use RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO anon, authenticated;

-- 2) RLS policies
DROP POLICY IF EXISTS "Anyone can create inventory" ON public.inventory;
CREATE POLICY "Anyone can create inventory"
  ON public.inventory FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update inventory" ON public.inventory;
CREATE POLICY "Anyone can update inventory"
  ON public.inventory FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete inventory" ON public.inventory;
CREATE POLICY "Anyone can delete inventory"
  ON public.inventory FOR DELETE
  TO anon, authenticated
  USING (true);
