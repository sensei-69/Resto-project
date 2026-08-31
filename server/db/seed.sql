-- Ember & Bun — lookup seed data (idempotent)
-- Run after schema.sql: psql "$DATABASE_URL" -f server/db/seed.sql

BEGIN;

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

COMMIT;
