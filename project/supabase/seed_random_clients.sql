-- Insert random clients into the clients table.
-- Run in Supabase SQL Editor.

INSERT INTO clients (name, phone, email)
SELECT
  name,
  CASE WHEN random() > 0.2 THEN '+212 6' || lpad(floor(random() * 90000000 + 10000000)::text, 8, '0') ELSE NULL END,
  CASE WHEN random() > 0.3 THEN lower(replace(name, ' ', '.')) || (floor(random() * 999) + 1)::text || '@example.com' ELSE NULL END
FROM (
  VALUES
    ('Ahmed Benali'),
    ('Fatima Alaoui'),
    ('Youssef Idrissi'),
    ('Salma Tazi'),
    ('Omar Bennis'),
    ('Laila Moussa'),
    ('Karim Chennouf'),
    ('Nadia Berrada'),
    ('Hassan Fassi'),
    ('Mariam El Amrani'),
    ('Khalid Zaki'),
    ('Zineb Bennani'),
    ('Mehdi Taha'),
    ('Sara Lamrani'),
    ('Ibrahim Kettani'),
    ('Amina Chraibi'),
    ('Rachid El Fassi'),
    ('Khadija Bennani'),
    ('Mustapha Alaoui'),
    ('Nour El Idrissi'),
    ('Younes Tazi'),
    ('Houda Bennis'),
    ('Anas Moussa'),
    ('Ines Berrada'),
    ('Soufiane Kettani')
) AS t(name);
