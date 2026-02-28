# Staff Management Persistence Test Guide

## Test Objective
Verify that newly created staff members persist in the global `StaffContext` when navigating between pages. This tests the fix for the bug where staff would disappear after navigation.

## Implementation Overview
The fix uses a global `StaffProvider` context that:
- Wraps the entire app (see `App.tsx` lines 89-96)
- Maintains a single source of truth for staff data
- Backs up data to localStorage for immediate display
- Automatically refreshes when the browser tab regains focus
- Provides methods to add, update, and remove staff locally before server sync

## Prerequisites
- Dev server running on http://localhost:5173/ (or http://localhost:5175/)
- Valid login credentials
- Browser with DevTools for console monitoring

## Test Steps

### 1. Open the Application
- Navigate to http://localhost:5175/ (or http://localhost:5173/)
- **Expected:** Login page appears

### 2. Log In
- Enter your credentials and sign in
- **Expected:** Dashboard/Home page loads
- **Check console:** Look for `[StaffContext] Initializing staff context`

### 3. Navigate to Staff Page
- Click on "Staff" in the sidebar
- **Expected:** Staff page loads showing current staff list
- **Note the current staff count** (e.g., "5 staff members")
- **Check console:** Look for:
  - `[StaffContext] fetchStaff called`
  - `[StaffContext] Fetched staff: { count: X, data: [...] }`

### 4. Create a New Staff Member
- Click the "Add Staff" button (top right, purple button with + icon)
- **Expected:** Modal opens with form fields

#### In the modal:
- Enter **Name:** `Test Staff Member`
- Enter **Role:** `Barber`
- **Observe:** Email and password auto-generate as you type the name
- Leave "Active" checkbox checked
- Click "Add Staff" button

**Expected Results:**
- Modal shows "Submitting..." with spinner
- After 2-3 seconds: Success screen appears with:
  - ✓ Green checkmark
  - "Staff Created Successfully!"
  - Login details displayed (email and temporary password)
- **Check console for these messages:**
  ```
  [StaffModal] Adding new staff to global context: Test Staff Member
  [StaffModal] Calling onSuccess and refreshing global context
  [StaffContext] refreshStaff called - forcing reload
  [StaffContext] fetchStaff called
  [StaffContext] Fetched staff: { count: X+1, data: [...] }
  ```

### 5. Close Success Modal and Verify Immediate Appearance
- Click "Done" button in success modal
- **Expected:**
  - Modal closes
  - Staff list refreshes
  - **NEW:** "Test Staff Member" appears in the staff list immediately
  - Staff count increases by 1
  - New staff card shows:
    - Name: "Test Staff Member"
    - Role: "Barber"
    - Email: auto-generated (e.g., `teststaffmember1234@salon.local`)
    - Badge: "Can sign in" (purple badge with lock icon)
    - Badge: "Active" (green badge)
    - ID displayed (e.g., `#a1b2c3d4`)

### 6. Navigate Away from Staff Page
- Click "Home" in the sidebar
- **Expected:** 
  - Home page loads
  - No errors in console

### 7. Navigate Back to Staff Page (THE CRITICAL TEST)
- Click "Staff" in the sidebar again
- **Expected (THIS IS THE KEY TEST):**
  - ✅ "Test Staff Member" is **STILL VISIBLE** in the list
  - ✅ Staff count is still increased (same as step 5)
  - ✅ No data loss occurred
- **Check console:** Look for:
  ```
  [StaffContext] fetchStaff called
  [StaffContext] Loading from localStorage backup: X items
  [StaffContext] Fetched staff: { count: X, data: [...] }
  ```

**PREVIOUS BUG:** Before the fix, the staff would disappear at this step because each component maintained its own local state.

### 8. Test Force Refresh Button
- Click the "Force Refresh" button (gray button next to "Add Staff")
- **Expected:**
  - Button shows spinning icon briefly
  - Staff list reloads
  - "Test Staff Member" is **STILL VISIBLE**
  - **Check console:** 
    ```
    [StaffContext] refreshStaff called - forcing reload
    [StaffContext] fetchStaff called
    ```

### 9. Test Browser Tab Focus (Optional)
- Switch to another browser tab or application
- Wait 2-3 seconds
- Switch back to the app
- **Expected:**
  - Staff list automatically refreshes
  - "Test Staff Member" is still visible
  - **Check console:**
    ```
    [StaffContext] Window focused, refreshing staff data
    [StaffContext] fetchStaff called
    ```

### 10. Test Search Functionality
- In the search box, type: `test`
- **Expected:**
  - Staff list filters to show only "Test Staff Member"
  - Other staff members are hidden
- Clear the search box
- **Expected:** All staff members appear again

### 11. Test Edit Functionality (Optional)
- Click the pencil icon on "Test Staff Member"
- Change the **Role** to `Senior Barber`
- Click "Save"
- **Expected:**
  - Modal closes
  - Staff card updates immediately to show "Senior Barber"
  - **Check console:**
    ```
    [StaffModal] Updating staff in global context: Test Staff Member
    ```

### 12. Navigate Away and Back Again (Final Verification)
- Navigate to "Home"
- Navigate back to "Staff"
- **Expected:**
  - ✅ "Test Staff Member" with updated role "Senior Barber" is still visible
  - ✅ All changes persisted

### 13. Cleanup (Optional)
- Click the trash icon on "Test Staff Member"
- Confirm deletion
- **Expected:**
  - Staff member removed from list immediately
  - Staff count decreases by 1
  - **Check console:**
    ```
    [StaffContext] Removing staff from local state: <staff-id>
    [StaffContext] refreshStaff called - forcing reload
    ```

## Success Criteria

✅ **PASS if ALL of these are true:**
1. New staff appears immediately after creation (step 5)
2. New staff persists when navigating away and back (step 7) ← **CRITICAL**
3. Force Refresh button maintains the staff (step 8)
4. No console errors during any navigation
5. Staff count remains consistent throughout navigation
6. Edit changes persist across navigation (step 12)

❌ **FAIL if ANY of these occur:**
- Staff disappears after navigating away and back
- Console shows errors like "Access denied" or "row-level security"
- Staff count resets to old value after navigation
- Force Refresh causes data loss

## Technical Details

### Key Implementation Points

1. **Global Context** (`StaffContext.tsx`):
   - Single `StaffProvider` wraps entire app
   - Maintains `staff` state array
   - Initializes once on mount (line 118-142)
   - Auto-refreshes on window focus (line 144-153)

2. **LocalStorage Backup** (lines 78-86, 124-137):
   - Backs up staff data after every fetch
   - Used for immediate display on navigation
   - Expires after 5 minutes
   - Key: `salon_staff_backup`

3. **Local State Management**:
   - `addStaff()`: Adds to local state immediately (line 103-106)
   - `updateStaff()`: Updates local state (line 108-111)
   - `removeStaff()`: Removes from local state (line 113-116)
   - All mutations trigger `refreshStaff()` to sync with server

4. **Component Integration** (`Staff.tsx`):
   - Uses `useStaff()` hook to access global context (line 8)
   - Calls `refreshStaff()` after mutations (lines 30, 51)
   - No local state for staff list (removed old `useState`)

5. **Modal Integration** (`StaffModal.tsx`):
   - Calls `addStaff()` immediately after DB insert (line 265)
   - Calls `refreshStaff()` after success (line 276)
   - Ensures UI updates before server confirmation

## Console Messages to Monitor

### Normal Flow:
```
[StaffContext] Initializing staff context
[StaffContext] Loading from localStorage backup: X items
[StaffContext] refreshStaff called - forcing reload
[StaffContext] fetchStaff called
[StaffContext] Fetched staff: { count: X, data: [...] }
```

### Creating Staff:
```
[StaffModal] Adding new staff to global context: Test Staff Member
[Staff] handleSuccess called, refreshing staff list from global context...
[StaffContext] refreshStaff called - forcing reload
[StaffContext] fetchStaff called
[Staff] Staff list refreshed, closing modal...
```

### Navigation:
```
[StaffContext] fetchStaff called
[StaffContext] Loading from localStorage backup: X items
[StaffContext] Fetched staff: { count: X, data: [...] }
```

## Troubleshooting

### Issue: Staff disappears after navigation
- **Check:** Is `StaffProvider` wrapping the app in `App.tsx`?
- **Check:** Is component using `useStaff()` hook instead of local state?
- **Check:** Browser localStorage for `salon_staff_backup` key

### Issue: "Access denied" errors
- **Solution:** Click "Force Refresh" to refresh session
- **Check:** Supabase RLS policies allow staff table access
- **Check:** User is logged in with valid session

### Issue: Staff appears twice
- **Cause:** Both local state AND global context rendering
- **Solution:** Remove local `useState` for staff in components

### Issue: Console shows "Could not Fast Refresh"
- **Cause:** Vite HMR limitation with context exports
- **Impact:** None - page will do a full refresh instead
- **Normal behavior:** Can be ignored

## Browser DevTools Tips

1. **Console Tab:**
   - Filter by `[StaffContext]` to see context logs
   - Filter by `[StaffModal]` to see modal logs
   - Filter by `[Staff]` to see component logs

2. **Application Tab (Chrome) / Storage Tab (Firefox):**
   - Navigate to Local Storage → `http://localhost:5173`
   - Look for `salon_staff_backup` key
   - Expand to see cached staff data

3. **Network Tab:**
   - Filter by `/staff` to see API calls
   - Check if data is being fetched from Supabase
   - Verify response includes new staff

## Expected Test Duration
- **Full test:** 5-7 minutes
- **Critical path (steps 1-7):** 3-4 minutes
- **With cleanup:** 8-10 minutes

## Test Status
- **Date:** _______________
- **Tester:** _______________
- **Result:** ✅ PASS / ❌ FAIL
- **Notes:** _______________________________________________

---

## Additional Tests (Advanced)

### Test Multiple Staff Creation
1. Create 3 staff members in a row
2. Navigate away after each creation
3. Return to Staff page
4. **Expected:** All 3 new staff members visible

### Test Concurrent Tabs (Multi-user Simulation)
1. Open app in two browser tabs
2. Create staff in Tab 1
3. Switch to Tab 2 (should auto-refresh on focus)
4. **Expected:** New staff appears in Tab 2

### Test Offline/Online
1. Create staff
2. Open DevTools → Network → Go offline
3. Navigate away and back
4. **Expected:** Staff visible from localStorage backup
5. Go online
6. **Expected:** Data syncs with server

---

**Version:** 1.0  
**Last Updated:** 2026-02-28  
**Related Files:**
- `project/src/lib/StaffContext.tsx`
- `project/src/components/Staff.tsx`
- `project/src/components/StaffModal.tsx`
- `project/src/App.tsx`
