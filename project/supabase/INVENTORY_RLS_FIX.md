# Fix: "new row violates row-level security policy" on Inventory

If Add/Edit/Delete product fails with this error, run the following in **Supabase Dashboard**.

## Steps

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** and select your project.
2. In the left sidebar click **SQL Editor**.
3. Click **New query**.
4. **Copy and paste the entire block below** into the editor.
5. Click **Run** (or press Ctrl+Enter).
6. You should see: **Success. No rows returned**
7. Try **Add Product** again in the SalonPro app.

## SQL to run

```sql
DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anyone can create inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anyone can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anyone can delete inventory" ON public.inventory;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
```

This removes RLS policies and disables row-level security on the `inventory` table so the app can insert, update, and delete without RLS blocking.
