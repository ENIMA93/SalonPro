-- One-time backfill: ensure every staff row with user_id has a profile so they can sign in.
INSERT INTO public.profiles (id, role, staff_id, must_change_password)
SELECT s.user_id, 'staff', s.id, true
FROM public.staff s
WHERE s.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.user_id)
ON CONFLICT (id) DO NOTHING;
