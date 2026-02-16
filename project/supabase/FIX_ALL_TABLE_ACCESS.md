# Fix: Can't reach database tables

If the app can't load data (blank lists, permission errors, or "row-level security" errors), run the SQL below in **Supabase Dashboard → SQL Editor**.

## Option A – GRANTs only (recommended first)

This gives the `anon` role permission to use the tables. Run the contents of:

**`migrations/20260215190000_grants_all_tables.sql`**

Or copy-paste this:

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.staff TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.appointments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO anon, authenticated;
```

Then try the app again.

---

## Option B – Disable RLS on all app tables (if Option A is not enough)

This turns off Row Level Security for the four app tables so the app can read/write without RLS blocking.

```sql
-- 1. GRANTs (same as Option A)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.staff TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.appointments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO anon, authenticated;

-- 2. Disable RLS on all app tables
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
```

Run the **entire** block in one go, then refresh the app.
