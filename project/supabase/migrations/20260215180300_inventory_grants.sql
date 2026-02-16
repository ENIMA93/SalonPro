-- Table-level GRANTs required for anon/authenticated to use RLS policies.
-- Supabase needs both GRANT and RLS policy; policies alone cause "violates row-level security policy".

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO anon, authenticated;
