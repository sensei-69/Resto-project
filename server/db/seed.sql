-- Ember & Bun — lookup seed data (idempotent)
-- Run after schema.sql: psql "$DATABASE_URL" -f server/db/seed.sql

BEGIN;

-- The Arabic labels below must be read as UTF-8 even when the client's OS
-- default encoding differs (prevents garbled name_ar values).
SET LOCAL client_encoding = 'UTF8';

INSERT INTO method_of_sale (code, name, description) VALUES
  ('DINE_IN',   'Dine in',   'Eat at the restaurant'),
  ('TAKE_AWAY', 'Take away', 'Pick up at the counter'),
  ('DELIVERY',  'Delivery',  'Delivered by a rider')
ON CONFLICT (code) DO NOTHING;

INSERT INTO payment_method (code, name, description) VALUES
  ('CASH', 'Cash', 'Pay with cash'),
  ('CARD', 'Card', 'Pay by card')
ON CONFLICT (code) DO NOTHING;

-- Valid (method_of_sale, payment_method) combinations.
-- delivery + card is intentionally absent: not allowed yet.
INSERT INTO sale_payment_rule (id_method_of_sale, id_payment_method)
SELECT m.id, p.id
FROM method_of_sale m
JOIN payment_method p ON (m.code, p.code) IN (
  ('DINE_IN',   'CASH'),
  ('DINE_IN',   'CARD'),
  ('TAKE_AWAY', 'CASH'),
  ('TAKE_AWAY', 'CARD'),
  ('DELIVERY',  'CASH')
)
ON CONFLICT DO NOTHING;

-- Starter divisions matching the brief's screenshot (bilingual labels).
INSERT INTO division (name, name_ar, sort_order)
SELECT v.name, v.name_ar, v.sort_order
FROM (VALUES
  ('Starters',   'مقبلات',        1),
  ('Mains',      'أطباق رئيسية',  2),
  ('Sandwiches', 'سندويش',        3),
  ('Drinks',     'مشروبات',       4),
  ('Desserts',   'حلويات',        5)
) AS v(name, name_ar, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM division d WHERE d.name = v.name);

-- Repair Arabic labels garbled by a previous seed run with a non-UTF8 client.
UPDATE division AS d
SET name_ar = v.name_ar
FROM (VALUES
  ('Starters',   'مقبلات'),
  ('Mains',      'أطباق رئيسية'),
  ('Sandwiches', 'سندويش'),
  ('Drinks',     'مشروبات'),
  ('Desserts',   'حلويات')
) AS v(name, name_ar)
WHERE d.name = v.name AND d.name_ar IS DISTINCT FROM v.name_ar;

-- Starter dining tables for dine-in checkout (1-6: two seats, 7-12: four, 13-14: six).
INSERT INTO dining_table (table_number, capacity)
SELECT n, CASE WHEN n <= 6 THEN 2 WHEN n <= 12 THEN 4 ELSE 6 END
FROM generate_series(1, 14) AS n
WHERE NOT EXISTS (SELECT 1 FROM dining_table t WHERE t.table_number = n);

COMMIT;
