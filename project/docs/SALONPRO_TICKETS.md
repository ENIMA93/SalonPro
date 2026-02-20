# SalonPro completion – tickets for GitHub Issues

Use these with **GitHub Issues** and **GitHub Projects** (free, same repo).

## Setup (one-time)

1. Open your repo: `https://github.com/ENIMA93/salonpro`
2. **Issues** → enable Issues in repo Settings if needed
3. **Projects** → New project → Board (or Table) → name it "SalonPro completion"
4. Create these **labels** (optional): `phase-1`, `phase-2`, `phase-3`, `phase-4`, `phase-5`, `optional`
5. Create each issue below (copy title + body); then in **Projects**, add each issue to the board and set status (Todo / In progress / Done)

---

## Phase 1 — Data consistency (~0.5–1 h)

### Issue 1.1: Include POS revenue in Dashboard "Total Revenue Today"
**Labels:** `phase-1`  
**Estimate:** 30–45 min

**Body:**
```
**Where:** `src/components/Dashboard.tsx`

**What:** In `fetchMetrics`, after computing revenue from completed appointments today, also query the `transactions` table for rows where `created_at` is today (same date range as appointments), sum `total_amount`, and add that sum to `totalRevenueToday`.

**Why:** "Total Revenue Today" should reflect both completed appointments and POS sales.

**Acceptance:** After making a POS sale today, Dashboard "Total Revenue (Today)" increases by that sale amount.
```

---

## Phase 2 — Staff and Services CRUD (~4–6 h)

### Issue 2.1: Staff CRUD (Add / Edit / Deactivate)
**Labels:** `phase-2`  
**Estimate:** 2–2.5 h

**Body:**
```
**Where:** `src/components/Staff.tsx`, new `StaffModal.tsx` (or reuse pattern from `ProductModal.tsx`)

**What:**
- Add "Add staff" button; open modal with form: name, role, is_active.
- For each staff card/row: Add "Edit" (open same modal prefilled) and "Deactivate" (or Delete).
- Supabase: ensure `staff` table allows INSERT/UPDATE/DELETE for anon (or authenticated) via RLS or grants; add migration if needed.

**Acceptance:** User can add new staff, edit name/role/active, and deactivate or delete staff from the Staff page.
```

### Issue 2.2: Services CRUD (Add / Edit / Delete)
**Labels:** `phase-2`  
**Estimate:** 2–2.5 h

**Body:**
```
**Where:** `src/components/Services.tsx`, new `ServiceModal.tsx`

**What:**
- Add "Add service" button; modal: name, duration_min, price, gender_category.
- List: add Edit and Delete per service.
- Supabase: ensure `services` allows INSERT/UPDATE/DELETE for anon (or authenticated); add migration if needed.

**Acceptance:** User can add, edit, and delete services from the Services page.
```

---

## Phase 3 — Appointments lifecycle (~3–4 h)

### Issue 3.1: Edit, cancel, and reschedule appointments
**Labels:** `phase-3`  
**Estimate:** 3–4 h

**Body:**
```
**Where:** `src/components/Calendar.tsx`, `src/components/BookingModal.tsx` (or new `EditAppointmentModal.tsx`)

**What:**
- On Calendar (and optionally Dashboard AppointmentsList): add per-row actions "Edit" and "Cancel".
- **Edit:** Open modal with client_name, service_id, staff_id, date_time, status; on submit call UPDATE on `appointments` by id.
- **Cancel:** Set appointment status to `cancelled` (or delete, per product decision).
- Reschedule = Edit with new date_time.

**Acceptance:** User can edit an existing appointment (client, service, staff, date/time, status) and cancel it from Calendar (and optionally Dashboard).
```

---

## Phase 4 — Settings (~1–1.5 h)

### Issue 4.1: Editable Settings (salon name, currency)
**Labels:** `phase-4`  
**Estimate:** 1–1.5 h

**Body:**
```
**Where:** `src/components/Settings.tsx`

**What:**
- Replace static "Salon name" and "Currency" with controlled inputs.
- Persist in `localStorage` (e.g. key `salonpro_settings`: `{ salonName, currency }`).
- On load, read from localStorage; use defaults "SalonPro" and "DH" if missing.
- Use saved salon name in Sidebar; use currency symbol/label wherever amounts are shown (e.g. "DH").

**Acceptance:** User can change salon name and currency in Settings; changes persist after refresh and appear in Sidebar and across the app.
```

---

## Phase 5 — Optional enhancements

### Issue 5.1 (Optional): Transactions – optional client name
**Labels:** `phase-5`, `optional`  
**Estimate:** 1–1.5 h

**Body:**
```
**What:**
- Migration: add column `client_name` (nullable text) to `transactions`.
- POS: add optional "Client name" field; send it when creating a transaction.
- Transactions page: show `row.client_name ?? 'Walk-in'` in the Client column.

**Acceptance:** POS can optionally capture a client name; Transactions list and receipts show it (or "Walk-in" when empty).
```

### Issue 5.2 (Optional): Clients table and CRUD
**Labels:** `phase-5`, `optional`  
**Estimate:** 3–4 h

**Body:**
```
**What:**
- Migration: create `clients` table (id, name, phone, email, created_at).
- Clients page: list clients; Add/Edit modal.
- BookingModal: allow selecting an existing client or entering a new name (and optionally create client record).
- Appointments: optionally add `client_id` FK; keep or phase out `client_name` as needed.

**Acceptance:** Dedicated clients list with add/edit; bookings can be linked to a client record.
```

### Issue 5.3 (Optional): URL routing (React Router)
**Labels:** `phase-5`, `optional`  
**Estimate:** 1–2 h

**Body:**
```
**What:**
- Add React Router; define routes: `/`, `/pos`, `/transactions`, `/inventory`, `/calendar`, `/services`, `/staff`, `/clients`, `/settings`.
- Sync `activeTab` with current route so Sidebar and URL stay in sync; support browser back/forward and shareable links.

**Acceptance:** Each main view has a URL; refreshing or sharing the link opens the correct view.
```

### Issue 5.4 (Optional): Auth (Supabase Auth)
**Labels:** `phase-5`, `optional`  
**Estimate:** 4–6 h

**Body:**
```
**What:**
- Add login screen (email/password or magic link via Supabase Auth).
- Protect app routes: show login when unauthenticated; after login show main app.
- Sidebar: show logged-in user (e.g. email) instead of hardcoded "Admin User".
- Optionally tighten RLS policies to use `auth.uid()`.

**Acceptance:** User must sign in to use the app; Sidebar shows current user; optional RLS by user.
```

---

## Quick copy-paste list (titles only)

1. Include POS revenue in Dashboard "Total Revenue Today"
2. Staff CRUD (Add / Edit / Deactivate)
3. Services CRUD (Add / Edit / Delete)
4. Edit, cancel, and reschedule appointments
5. Editable Settings (salon name, currency)
6. [Optional] Transactions – optional client name
7. [Optional] Clients table and CRUD
8. [Optional] URL routing (React Router)
9. [Optional] Auth (Supabase Auth)

---

## Creating issues via GitHub CLI (optional)

If you have [GitHub CLI](https://cli.github.com/) installed and authenticated (`gh auth login`), run from the **project** folder (create labels `phase-1` through `phase-5` and `optional` first, or remove `--label` from the script):

```powershell
cd project
.\docs\create-github-issues.ps1
```

(You’d still need to copy each issue body into a separate file or use `gh issue create` once per ticket with the body text.)

The script `docs/create-github-issues.ps1` creates all 9 issues with titles and bodies.
