/*
  # Clients: unique email, phone format +212XXXXXXXXX, merge duplicates

  1. Normalize existing phone numbers to +212XXXXXXXXX (9 digits)
  2. Merge duplicate clients (by email, then by phone) – keep one per email/phone
  3. Unique constraint on email (case-insensitive)
  4. Unique constraint on phone
  5. Check constraint: phone is null or matches +212 and exactly 9 digits
*/

-- 1. Normalize phone: extract digits, then +212 + 9 digits (Morocco)
UPDATE clients
SET phone = CASE
  WHEN LENGTH(d) = 9 THEN '+212' || d
  WHEN LENGTH(d) = 10 AND LEFT(d, 1) = '0' THEN '+212' || SUBSTRING(d FROM 2 FOR 9)
  ELSE NULL
END
FROM (
  SELECT id, regexp_replace(phone, '[^0-9]', '', 'g') AS d
  FROM clients
  WHERE phone IS NOT NULL AND trim(phone) != ''
) sub
WHERE clients.id = sub.id
  AND sub.d ~ '^[0-9]{9}$|^0[0-9]{9}$';

-- Set invalid phones to null so check constraint will pass later
UPDATE clients
SET phone = NULL
WHERE phone IS NOT NULL
  AND phone !~ '^\+212[0-9]{9}$';

-- 2. Merge duplicates by email: keep row with smallest id per lower(trim(email))
DELETE FROM clients c1
USING clients c2
WHERE c1.email IS NOT NULL
  AND trim(c1.email) != ''
  AND lower(trim(c1.email)) = lower(trim(c2.email))
  AND c1.id > c2.id;

-- 3. Merge duplicates by phone: keep row with smallest id per phone
DELETE FROM clients c1
USING clients c2
WHERE c1.phone IS NOT NULL
  AND c1.phone = c2.phone
  AND c1.id > c2.id;

-- 4. Unique index on email (case-insensitive, only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_lower_key
  ON clients (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) != '';

-- 5. Unique index on phone (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS clients_phone_key
  ON clients (phone)
  WHERE phone IS NOT NULL;

-- 6. Check: phone must be null or exactly +212 followed by 9 digits
ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_phone_format;
ALTER TABLE clients
  ADD CONSTRAINT clients_phone_format
  CHECK (phone IS NULL OR phone ~ '^\+212[0-9]{9}$');

COMMENT ON COLUMN clients.phone IS 'Morocco format: +212 followed by 9 digits (e.g. +212612345678)';
COMMENT ON COLUMN clients.email IS 'Must be unique across clients';
