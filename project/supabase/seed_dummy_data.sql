-- Dummy data for SalonPro (currency: DH Morocco)
-- Run this script after migrations in Supabase SQL Editor

-- 1. STAFF (5 members)
INSERT INTO staff (id, name, role, is_active) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Youssef Bennani', 'Barber', true),
  ('a0000001-0001-4000-8000-000000000002', 'Fatima Alaoui', 'Stylist', true),
  ('a0000001-0001-4000-8000-000000000003', 'Karim El Amrani', 'Senior Barber', true),
  ('a0000001-0001-4000-8000-000000000004', 'Salma Tazi', 'Stylist', true),
  ('a0000001-0001-4000-8000-000000000005', 'Omar Idrissi', 'Barber', true);

-- 2. SERVICES (10 services - prices in DH)
INSERT INTO services (id, name, duration_min, price, gender_category) VALUES
  ('b0000002-0002-4000-8000-000000000001', 'Haircut Classic', 30, 80, 'all'),
  ('b0000002-0002-4000-8000-000000000002', 'Haircut Premium', 45, 120, 'all'),
  ('b0000002-0002-4000-8000-000000000003', 'Beard Trim', 20, 40, 'male'),
  ('b0000002-0002-4000-8000-000000000004', 'Beard & Mustache Styling', 30, 60, 'male'),
  ('b0000002-0002-4000-8000-000000000005', 'Face Facial', 45, 150, 'all'),
  ('b0000002-0002-4000-8000-000000000006', 'Deep Cleansing Facial', 60, 220, 'all'),
  ('b0000002-0002-4000-8000-000000000007', 'Head Massage', 30, 100, 'all'),
  ('b0000002-0002-4000-8000-000000000008', 'Relaxation Massage', 45, 180, 'all'),
  ('b0000002-0002-4000-8000-000000000009', 'Haircut + Beard Combo', 45, 110, 'male'),
  ('b0000002-0002-4000-8000-000000000010', 'Premium Facial & Massage', 90, 350, 'all');

-- 3. INVENTORY (5 items - prices in DH)
INSERT INTO inventory (id, product_name, stock_count, price) VALUES
  ('c0000003-0003-4000-8000-000000000001', 'Shampoo Revitalizing', 24, 45),
  ('c0000003-0003-4000-8000-000000000002', 'Shampoo Anti-Dandruff', 18, 55),
  ('c0000003-0003-4000-8000-000000000003', 'Styling Gel Strong Hold', 30, 35),
  ('c0000003-0003-4000-8000-000000000004', 'Styling Gel Light', 25, 30),
  ('c0000003-0003-4000-8000-000000000005', 'Beard Oil Premium', 15, 80);

-- 4. APPOINTMENTS (3 past + 3 future)
-- Past appointments
INSERT INTO appointments (client_name, service_id, staff_id, date_time, status) VALUES
  ('Ahmed Khalil', 'b0000002-0002-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001', NOW() - INTERVAL '3 days' + INTERVAL '10 hours', 'completed'),
  ('Mariam Bennis', 'b0000002-0002-4000-8000-000000000005', 'a0000001-0001-4000-8000-000000000002', NOW() - INTERVAL '1 day' + INTERVAL '14 hours', 'completed'),
  ('Hassan Moussa', 'b0000002-0002-4000-8000-000000000009', 'a0000001-0001-4000-8000-000000000003', NOW() - INTERVAL '5 hours', 'completed');

-- Future appointments
INSERT INTO appointments (client_name, service_id, staff_id, date_time, status) VALUES
  ('Laila Chennouf', 'b0000002-0002-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000004', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'scheduled'),
  ('Omar Fassi', 'b0000002-0002-4000-8000-000000000008', 'a0000001-0001-4000-8000-000000000005', NOW() + INTERVAL '2 days' + INTERVAL '15 hours', 'scheduled'),
  ('Nadia Berrada', 'b0000002-0002-4000-8000-000000000006', 'a0000001-0001-4000-8000-000000000002', NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 'scheduled');
