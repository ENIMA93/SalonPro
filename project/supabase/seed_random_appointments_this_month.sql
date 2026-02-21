-- Random appointments for each day of the current month (different statuses)
-- Run in Supabase SQL Editor. Uses existing staff and services.

INSERT INTO appointments (client_name, service_id, staff_id, date_time, status)
SELECT
  (ARRAY[
    'Ahmed Benali', 'Fatima Alaoui', 'Youssef Idrissi', 'Salma Tazi', 'Omar Bennis',
    'Laila Moussa', 'Karim Chennouf', 'Nadia Berrada', 'Hassan Fassi', 'Mariam El Amrani',
    'Khalid Zaki', 'Zineb Bennani', 'Mehdi Taha', 'Sara Lamrani', 'Ibrahim Kettani'
  ])[1 + floor(random() * 15)::int],
  (SELECT id FROM services ORDER BY random() LIMIT 1),
  (SELECT id FROM staff ORDER BY random() LIMIT 1),
  (d::date + time '09:00' + (random() * interval '10 hours'))::timestamptz,
  (ARRAY['scheduled', 'in-progress', 'completed', 'cancelled'])[1 + floor(random() * 4)::int]
FROM generate_series(
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
  '1 day'::interval
) AS d
CROSS JOIN LATERAL generate_series(1, 2 + (random() > 0.35)::int) AS slot;
