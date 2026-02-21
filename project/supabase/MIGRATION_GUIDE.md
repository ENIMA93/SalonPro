# Running Supabase migrations

Migrations are in `supabase/migrations/`. Apply them in **date order** (filename prefix).

## Method 1: Supabase Dashboard (no CLI)

1. Open your project: **https://supabase.com/dashboard** → your project.
2. Go to **SQL Editor**.
3. For each migration you haven’t run yet, open the `.sql` file, copy its contents, paste into the editor, and click **Run**.

### Pending migration: Clients table

If you haven’t applied the clients table yet, run this in the SQL Editor:

**File:** `migrations/20260219120000_create_clients_table.sql`

Or copy-paste:

```sql
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
```

---

## Method 2: Supabase CLI

If you use the Supabase CLI and the project is linked:

```bash
# From project root
npx supabase db push
```

Or, to run migrations against a remote DB by URL:

```bash
npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Replace `[YOUR-PASSWORD]` and `[PROJECT-REF]` with your project’s database password and reference (from Dashboard → Settings → Database).

---

## Checking what’s applied

- **Dashboard:** Table Editor → you should see a `clients` table after running the migration above.
- **CLI:** `npx supabase migration list` (when linked) shows which migrations have been applied.
