-- Allow anon and authenticated to access all app tables
-- Run this in Supabase Dashboard → SQL Editor if you get permission/RLS errors on any table

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Staff: read only
GRANT SELECT ON public.staff TO anon, authenticated;

-- Services: read only
GRANT SELECT ON public.services TO anon, authenticated;

-- Appointments: read, insert, update
GRANT SELECT, INSERT, UPDATE ON public.appointments TO anon, authenticated;

-- Inventory: full access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO anon, authenticated;
