# Auth and accounts setup

## First admin

1. Run migrations so the `profiles` table and `claim_admin()` function exist.
2. In Supabase Dashboard → **Authentication** → **Users** → **Add user**, create a user with an email and password.
3. Open the app, sign in with that email and password.
4. You will see **Set up admin**: click **I'm the owner – set as admin**. You then have full access.

## Staff accounts

- Only admins can create staff. Each new staff member gets a login account.
- In **Staff** → **Add Staff**, enter name, role, **email**, and a **temporary password** (min 8 characters). The staff member uses this email and password to sign in and will be prompted to set a new password on first login.
- Creating the auth user is done by the Edge Function `create-staff-user`, which must be deployed and have the correct secrets.

### If new staff can't log in (no row in `profiles`)

The app needs a row in the **profiles** table for each user. The Edge Function creates that row when you add staff. If the row is missing (e.g. the function failed when the DB was missing a column), do this:

1. **Apply the profiles migration** so the table has the `must_change_password` column. In Supabase Dashboard → **SQL Editor**, run the contents of `supabase/migrations/20260228120000_profiles_must_change_password.sql`, or run `npm run supabase:db-push` from the project root if you use the CLI.
2. **Redeploy the Edge Function**: `npm run supabase:deploy`.
3. For any **existing** auth user that has no profile row: in SQL Editor run (replace `USER_UUID` with the user’s id from Authentication → Users):
   ```sql
   INSERT INTO public.profiles (id, role, staff_id, must_change_password)
   SELECT id, 'staff', s.id, true
   FROM auth.users u
   JOIN public.staff s ON s.user_id = u.id
   WHERE u.id = 'USER_UUID'
   ON CONFLICT (id) DO NOTHING;
   ```
   If that user is not linked to a staff row, use:
   ```sql
   INSERT INTO public.profiles (id, role, staff_id, must_change_password)
   VALUES ('USER_UUID', 'staff', NULL, true)
   ON CONFLICT (id) DO NOTHING;
   ```

## Edge Function deployment

1. Deploy: `supabase functions deploy create-staff-user`
2. Set secrets (Supabase Dashboard → Edge Functions → create-staff-user → Secrets):
   - `SUPABASE_URL` = your project URL (e.g. `https://YOUR_PROJECT_REF.supabase.co` — same as `VITE_SUPABASE_URL` in your app `.env`)
   - `SUPABASE_SERVICE_ROLE_KEY` = service role key (used to create users and update staff/profiles). **Never expose this in the frontend.**
   - **Recommended:** `SUPABASE_ANON_KEY` = your project’s anon (public) key — same value as `VITE_SUPABASE_ANON_KEY` in your app `.env`. The function uses it to verify the caller’s JWT via Supabase Auth; this works for all projects and avoids "Invalid JWT" in most cases.
   - **Optional fallback:** If you still see "Invalid JWT", add `SUPABASE_JWT_SECRET` (value from Dashboard → **Settings** → **API** → **JWT Secret**) for legacy symmetric verification.

The function tries, in order: Supabase Auth with `SUPABASE_ANON_KEY`, then JWKS, then `SUPABASE_JWT_SECRET` if set.

## Roles and access

- **Admin**: full read/write/delete on Staff, Services, Inventory, Appointments, Transactions, Clients, Settings; sees Dashboard KPIs.
- **Staff**: can use Home, Appointments, Calendar, POS, Sales history (read), and Profile. Cannot access Staff, Services, Inventory, Settings, or Dashboard KPIs.

## Deactivating or deleting staff

- **Deactivate**: set the staff member to inactive in **Staff**. They remain in the list but can be hidden from booking/POS dropdowns. Their login still works; you can optionally disable the user in Supabase Dashboard → Authentication → Users if you want to block login.
- **Delete**: deleting a staff member removes their row from `staff`. If they had a login account, their auth user is not removed automatically. To revoke access, disable or delete that user in Supabase Dashboard → **Authentication** → **Users**.
