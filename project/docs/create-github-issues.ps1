# Create SalonPro completion issues in GitHub (requires: gh auth login)
# Run from repo root: .\docs\create-github-issues.ps1

$issues = @(
    @{
        Title = "Include POS revenue in Dashboard `"Total Revenue Today`""
        Body = @"
**Where:** ``src/components/Dashboard.tsx``

**What:** In ``fetchMetrics``, after computing revenue from completed appointments today, also query the ``transactions`` table for rows where ``created_at`` is today (same date range as appointments), sum ``total_amount``, and add that sum to ``totalRevenueToday``.

**Why:** "Total Revenue Today" should reflect both completed appointments and POS sales.

**Acceptance:** After making a POS sale today, Dashboard "Total Revenue (Today)" increases by that sale amount.
"@
        Labels = "phase-1"
    },
    @{
        Title = "Staff CRUD (Add / Edit / Deactivate)"
        Body = @"
**Where:** ``src/components/Staff.tsx``, new ``StaffModal.tsx``

**What:** Add "Add staff" button and modal (name, role, is_active). Per staff: Edit and Deactivate/Delete. Ensure ``staff`` table allows INSERT/UPDATE/DELETE via RLS/grants.

**Acceptance:** User can add, edit, and deactivate/delete staff from the Staff page.
"@
        Labels = "phase-2"
    },
    @{
        Title = "Services CRUD (Add / Edit / Delete)"
        Body = @"
**Where:** ``src/components/Services.tsx``, new ``ServiceModal.tsx``

**What:** Add "Add service" button and modal (name, duration_min, price, gender_category). Per service: Edit and Delete. Ensure ``services`` allows INSERT/UPDATE/DELETE.

**Acceptance:** User can add, edit, and delete services from the Services page.
"@
        Labels = "phase-2"
    },
    @{
        Title = "Edit, cancel, and reschedule appointments"
        Body = @"
**Where:** ``src/components/Calendar.tsx``, ``BookingModal.tsx`` or new ``EditAppointmentModal``

**What:** Calendar (and optionally Dashboard): add Edit and Cancel per appointment. Edit = modal with client_name, service_id, staff_id, date_time, status; UPDATE by id. Cancel = set status to cancelled. Reschedule = Edit with new date_time.

**Acceptance:** User can edit and cancel appointments from Calendar (and optionally Dashboard).
"@
        Labels = "phase-3"
    },
    @{
        Title = "Editable Settings (salon name, currency)"
        Body = @"
**Where:** ``src/components/Settings.tsx``

**What:** Replace static values with inputs; persist in localStorage (e.g. ``salonpro_settings``). Use in Sidebar and wherever currency is shown.

**Acceptance:** User can change salon name and currency; values persist and appear across the app.
"@
        Labels = "phase-4"
    },
    @{
        Title = "[Optional] Transactions – optional client name"
        Body = "Migration: add ``client_name`` to ``transactions``. POS: optional client field. Transactions page: show client or Walk-in."
        Labels = "phase-5,optional"
    },
    @{
        Title = "[Optional] Clients table and CRUD"
        Body = "Migration: ``clients`` table. Clients page: list + Add/Edit. BookingModal: select or create client. Optional ``client_id`` on appointments."
        Labels = "phase-5,optional"
    },
    @{
        Title = "[Optional] URL routing (React Router)"
        Body = "Add React Router; routes for /, /pos, /transactions, etc.; sync activeTab with URL for shareable links and back button."
        Labels = "phase-5,optional"
    },
    @{
        Title = "[Optional] Auth (Supabase Auth)"
        Body = "Login screen; protect routes; show user in Sidebar; optional RLS by auth.uid()."
        Labels = "phase-5,optional"
    }
)

foreach ($issue in $issues) {
    $bodyFile = [System.IO.Path]::GetTempFileName()
    $issue.Body | Set-Content -Path $bodyFile -Encoding UTF8
    gh issue create --title $issue.Title --body-file $bodyFile --label $issue.Labels
    Remove-Item $bodyFile
    Start-Sleep -Milliseconds 500
}

Write-Host "Done. Open your repo Issues and Projects to assign and track."
