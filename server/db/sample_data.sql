-- Ember & Bun — sample data
-- Populates the catalog with a realistic menu, offers, tables, and example
-- orders so the app is immediately usable after a fresh schema + seed run.
--
-- Prerequisites: schema.sql and seed.sql must have been applied first.
-- Run: psql "$DATABASE_URL" -f server/db/sample_data.sql

BEGIN;

-- ===========================================================================
-- 1. Dining tables
-- ===========================================================================
INSERT INTO dining_table (table_number, capacity) VALUES
  (1, 2), (2, 2), (3, 4), (4, 4), (5, 4),
  (6, 6), (7, 6), (8, 8), (9, 8), (10, 10)
ON CONFLICT (table_number) DO NOTHING;

-- ===========================================================================
-- 2. Extra division (seed.sql already has 5; add Grill)
-- ===========================================================================
INSERT INTO division (name, name_ar, sort_order)
SELECT 'Grill', 'مشاوي', 6
WHERE NOT EXISTS (SELECT 1 FROM division WHERE name = 'Grill');

-- ===========================================================================
-- 3. Ingredients (shared master list)
-- ===========================================================================
INSERT INTO ingredient (name) VALUES
  ('Beef Patty'), ('Chicken Thigh'), ('Lamb'), ('Merguez'),
  ('Smoked Bacon'), ('Aged Cheddar'), ('Swiss Cheese'), ('Mozzarella'),
  ('Truffle Mayo'), ('Ember Sauce'), ('Sriracha Slaw'), ('Caramelised Onion'),
  ('Pickles'), ('Lettuce'), ('Tomato'), ('Red Onion'), ('Jalapeño'),
  ('Harissa'), ('Garlic Sauce'), ('Herb Aioli'), ('Rosemary'), ('Sea Salt'),
  ('Potatoes'), ('Couscous'), ('Chickpeas'), ('Carrots'), ('Zucchini'),
  ('Basil'), ('Oregano'), ('Tomato Base'), ('Pepperoni'), ('Truffle Cream'),
  ('Mushroom'), ('Parmesan'), ('Vanilla Ice Cream'), ('Dark Chocolate'),
  ('Brioche'), ('Oat Milk'), ('Ice'), ('Mint'), ('Sugar Syrup'),
  ('Whole Milk'), ('Burnt Honey'), ('Frik'), ('Cilantro'), ('Egg'),
  ('Tuna'), ('Olives'), ('Baguette'), ('Flatbread')
ON CONFLICT (name) DO NOTHING;

-- ===========================================================================
-- 4. Categories
-- ===========================================================================

-- Burgers (Sandwiches division)
INSERT INTO category (name, id_division, id_category)
SELECT 'Burgers', d.id, NULL FROM division d WHERE d.name = 'Sandwiches'
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Burgers' AND id_category IS NULL);

INSERT INTO category (name, id_division, id_category)
SELECT 'Beef Burgers', d.id, c.id FROM division d, category c
WHERE d.name = 'Sandwiches' AND c.name = 'Burgers' AND c.id_category IS NULL
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Beef Burgers');

INSERT INTO category (name, id_division, id_category)
SELECT 'Chicken Burgers', d.id, c.id FROM division d, category c
WHERE d.name = 'Sandwiches' AND c.name = 'Burgers' AND c.id_category IS NULL
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Chicken Burgers');

-- Pizza (Mains division)
INSERT INTO category (name, id_division, id_category)
SELECT 'Pizza', d.id, NULL FROM division d WHERE d.name = 'Mains'
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Pizza' AND id_category IS NULL);

INSERT INTO category (name, id_division, id_category)
SELECT 'Classic Pizza', d.id, c.id FROM division d, category c
WHERE d.name = 'Mains' AND c.name = 'Pizza' AND c.id_category IS NULL
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Classic Pizza');

INSERT INTO category (name, id_division, id_category)
SELECT 'White Base Pizza', d.id, c.id FROM division d, category c
WHERE d.name = 'Mains' AND c.name = 'Pizza' AND c.id_category IS NULL
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'White Base Pizza');

-- Sides (Starters division)
INSERT INTO category (name, id_division, id_category)
SELECT 'Sides', d.id, NULL FROM division d WHERE d.name = 'Starters'
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Sides' AND id_category IS NULL);

-- Drinks
INSERT INTO category (name, id_division, id_category)
SELECT 'Cold Drinks', d.id, NULL FROM division d WHERE d.name = 'Drinks'
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Cold Drinks');

INSERT INTO category (name, id_division, id_category)
SELECT 'Hot Drinks', d.id, NULL FROM division d WHERE d.name = 'Drinks'
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Hot Drinks');

-- Desserts
INSERT INTO category (name, id_division, id_category)
SELECT 'Desserts', d.id, NULL FROM division d WHERE d.name = 'Desserts'
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Desserts' AND id_category IS NULL);

-- Grill
INSERT INTO category (name, id_division, id_category)
SELECT 'Grill', d.id, NULL FROM division d WHERE d.name = 'Grill'
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Grill' AND id_category IS NULL);

INSERT INTO category (name, id_division, id_category)
SELECT 'Merguez', d.id, c.id FROM division d, category c
WHERE d.name = 'Grill' AND c.name = 'Grill' AND c.id_category IS NULL
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Merguez');

INSERT INTO category (name, id_division, id_category)
SELECT 'Kebab', d.id, c.id FROM division d, category c
WHERE d.name = 'Grill' AND c.name = 'Grill' AND c.id_category IS NULL
AND NOT EXISTS (SELECT 1 FROM category WHERE name = 'Kebab');

-- ===========================================================================
-- 5. Category ingredient eligibility
-- ===========================================================================

INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
SELECT c.id, i.id,
  i.name IN ('Beef Patty','Aged Cheddar','Ember Sauce','Pickles','Lettuce','Tomato','Red Onion','Caramelised Onion'),
  i.name IN ('Smoked Bacon','Truffle Mayo','Aged Cheddar')
FROM category c, ingredient i
WHERE c.name = 'Beef Burgers'
  AND i.name IN ('Beef Patty','Aged Cheddar','Ember Sauce','Pickles','Lettuce','Tomato','Red Onion','Caramelised Onion','Smoked Bacon','Truffle Mayo')
ON CONFLICT DO NOTHING;

INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
SELECT c.id, i.id,
  i.name IN ('Chicken Thigh','Sriracha Slaw','Pickles','Lettuce','Herb Aioli'),
  i.name IN ('Jalapeño','Aged Cheddar')
FROM category c, ingredient i
WHERE c.name = 'Chicken Burgers'
  AND i.name IN ('Chicken Thigh','Sriracha Slaw','Pickles','Lettuce','Herb Aioli','Jalapeño','Aged Cheddar')
ON CONFLICT DO NOTHING;

INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
SELECT c.id, i.id,
  i.name IN ('Mozzarella','Tomato Base','Basil','Oregano'),
  i.name IN ('Pepperoni','Smoked Bacon','Jalapeño')
FROM category c, ingredient i
WHERE c.name = 'Classic Pizza'
  AND i.name IN ('Mozzarella','Tomato Base','Basil','Oregano','Pepperoni','Smoked Bacon','Jalapeño')
ON CONFLICT DO NOTHING;

INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
SELECT c.id, i.id,
  i.name IN ('Truffle Cream','Mushroom','Parmesan','Mozzarella'),
  i.name IN ('Smoked Bacon','Truffle Mayo')
FROM category c, ingredient i
WHERE c.name = 'White Base Pizza'
  AND i.name IN ('Truffle Cream','Mushroom','Parmesan','Mozzarella','Smoked Bacon','Truffle Mayo')
ON CONFLICT DO NOTHING;

INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
SELECT c.id, i.id, TRUE, FALSE
FROM category c, ingredient i
WHERE c.name = 'Sides' AND i.name IN ('Potatoes','Rosemary','Sea Salt')
ON CONFLICT DO NOTHING;

INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
SELECT c.id, i.id, TRUE, FALSE
FROM category c, ingredient i
WHERE c.name = 'Cold Drinks'
  AND i.name IN ('Oat Milk','Ice','Mint','Sugar Syrup','Whole Milk','Burnt Honey')
ON CONFLICT DO NOTHING;

INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
SELECT c.id, i.id,
  i.name IN ('Dark Chocolate','Brioche'),
  i.name = 'Vanilla Ice Cream'
FROM category c, ingredient i
WHERE c.name = 'Desserts'
  AND i.name IN ('Dark Chocolate','Brioche','Vanilla Ice Cream')
ON CONFLICT DO NOTHING;

INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
SELECT c.id, i.id, TRUE, i.name = 'Harissa'
FROM category c, ingredient i
WHERE c.name = 'Merguez' AND i.name IN ('Merguez','Baguette','Harissa','Red Onion')
ON CONFLICT DO NOTHING;

INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
SELECT c.id, i.id, TRUE, i.name IN ('Garlic Sauce','Harissa')
FROM category c, ingredient i
WHERE c.name = 'Kebab'
  AND i.name IN ('Chicken Thigh','Lamb','Flatbread','Garlic Sauce','Harissa','Lettuce')
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- 6. Products
-- ===========================================================================

INSERT INTO product (name, description, price, id_category)
SELECT 'Double Smash Ember', 'Two smashed beef patties, aged cheddar, ember sauce', 13.50, c.id
FROM category c WHERE c.name = 'Beef Burgers'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Double Smash Ember');

INSERT INTO product (name, description, price, id_category)
SELECT 'Truffle Melt Deluxe', 'Single patty, truffle mayo, caramelised onion, swiss cheese', 15.00, c.id
FROM category c WHERE c.name = 'Beef Burgers'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Truffle Melt Deluxe');

INSERT INTO product (name, description, price, id_category)
SELECT 'Flame Bacon Stack', 'Double patty, smoked bacon, cheddar, pickles', 14.50, c.id
FROM category c WHERE c.name = 'Beef Burgers'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Flame Bacon Stack');

INSERT INTO product (name, description, price, id_category)
SELECT 'Charcoal Chicken Bun', 'Chicken thigh, charcoal bun, sriracha slaw', 12.00, c.id
FROM category c WHERE c.name = 'Chicken Burgers'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Charcoal Chicken Bun');

INSERT INTO product (name, description, price, id_category)
SELECT 'Herb Aioli Bird', 'Buttermilk chicken, herb aioli, lettuce, tomato', 11.50, c.id
FROM category c WHERE c.name = 'Chicken Burgers'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Herb Aioli Bird');

INSERT INTO product (name, description, price, id_category)
SELECT 'Margherita', 'San Marzano tomato, mozzarella, fresh basil', 11.00, c.id
FROM category c WHERE c.name = 'Classic Pizza'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Margherita');

INSERT INTO product (name, description, price, id_category)
SELECT 'Pepperoni Blaze', 'Double pepperoni, mozzarella, oregano', 13.50, c.id
FROM category c WHERE c.name = 'Classic Pizza'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Pepperoni Blaze');

INSERT INTO product (name, description, price, id_category)
SELECT 'Tartufo', 'Truffle cream, mushroom, parmesan, thyme', 15.00, c.id
FROM category c WHERE c.name = 'White Base Pizza'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Tartufo');

INSERT INTO product (name, description, price, id_category)
SELECT 'Rosemary Skin Fries', 'Skin-on fries, rosemary, sea salt', 4.50, c.id
FROM category c WHERE c.name = 'Sides'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Rosemary Skin Fries');

INSERT INTO product (name, description, price, id_category)
SELECT 'Smoked Cola 33cl', 'Bottled smoked cola', 2.80, c.id
FROM category c WHERE c.name = 'Cold Drinks'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Smoked Cola 33cl');

INSERT INTO product (name, description, price, id_category)
SELECT 'Burnt Honey Milkshake', 'Vanilla ice cream, burnt honey, whole milk', 5.40, c.id
FROM category c WHERE c.name = 'Cold Drinks'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Burnt Honey Milkshake');

INSERT INTO product (name, description, price, id_category)
SELECT 'Fresh Lemonade', 'Hand-squeezed, mint, sugar syrup', 3.50, c.id
FROM category c WHERE c.name = 'Cold Drinks'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Fresh Lemonade');

INSERT INTO product (name, description, price, id_category)
SELECT 'Molten Chocolate Bun', 'Warm dark chocolate center, brioche, vanilla ice cream', 6.20, c.id
FROM category c WHERE c.name = 'Desserts'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Molten Chocolate Bun');

INSERT INTO product (name, description, price, id_category)
SELECT 'Merguez Sandwich', 'Spicy lamb sausage in baguette, harissa, onion', 7.50, c.id
FROM category c WHERE c.name = 'Merguez'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Merguez Sandwich');

INSERT INTO product (name, description, price, id_category)
SELECT 'Merguez Plate', 'Grilled merguez, rosemary fries, harissa', 11.00, c.id
FROM category c WHERE c.name = 'Merguez'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Merguez Plate');

INSERT INTO product (name, description, price, id_category)
SELECT 'Chicken Kebab Wrap', 'Grilled chicken in flatbread, garlic sauce, lettuce', 8.50, c.id
FROM category c WHERE c.name = 'Kebab'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Chicken Kebab Wrap');

INSERT INTO product (name, description, price, id_category)
SELECT 'Lamb Kebab Skewer', 'Two grilled lamb skewers, harissa', 13.00, c.id
FROM category c WHERE c.name = 'Kebab'
AND NOT EXISTS (SELECT 1 FROM product WHERE name = 'Lamb Kebab Skewer');

-- ===========================================================================
-- 7. Product ingredients
-- ===========================================================================

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Beef Patty','Aged Cheddar','Ember Sauce','Pickles'),
  i.name IN ('Aged Cheddar','Ember Sauce','Pickles'),
  i.name IN ('Smoked Bacon','Truffle Mayo'),
  CASE WHEN i.name = 'Smoked Bacon' THEN 1.50 WHEN i.name = 'Truffle Mayo' THEN 0.90 END
FROM product p, ingredient i
WHERE p.name = 'Double Smash Ember'
  AND i.name IN ('Beef Patty','Aged Cheddar','Ember Sauce','Pickles','Smoked Bacon','Truffle Mayo')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Beef Patty','Truffle Mayo','Caramelised Onion'),
  i.name IN ('Truffle Mayo','Caramelised Onion'),
  FALSE, NULL
FROM product p, ingredient i
WHERE p.name = 'Truffle Melt Deluxe'
  AND i.name IN ('Beef Patty','Truffle Mayo','Caramelised Onion')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Beef Patty','Smoked Bacon','Aged Cheddar','Pickles'),
  i.name IN ('Smoked Bacon','Pickles'),
  FALSE, NULL
FROM product p, ingredient i
WHERE p.name = 'Flame Bacon Stack'
  AND i.name IN ('Beef Patty','Smoked Bacon','Aged Cheddar','Pickles')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Chicken Thigh','Sriracha Slaw','Pickles'),
  i.name IN ('Sriracha Slaw','Pickles'),
  i.name = 'Jalapeño',
  CASE WHEN i.name = 'Jalapeño' THEN 0.80 END
FROM product p, ingredient i
WHERE p.name = 'Charcoal Chicken Bun'
  AND i.name IN ('Chicken Thigh','Sriracha Slaw','Pickles','Jalapeño')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Mozzarella','Tomato Base','Basil'),
  i.name = 'Basil',
  i.name = 'Pepperoni',
  CASE WHEN i.name = 'Pepperoni' THEN 2.20 END
FROM product p, ingredient i
WHERE p.name = 'Margherita'
  AND i.name IN ('Mozzarella','Tomato Base','Basil','Pepperoni')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Pepperoni','Mozzarella','Oregano','Tomato Base'),
  i.name = 'Oregano',
  i.name = 'Smoked Bacon',
  CASE WHEN i.name = 'Smoked Bacon' THEN 1.50 END
FROM product p, ingredient i
WHERE p.name = 'Pepperoni Blaze'
  AND i.name IN ('Pepperoni','Mozzarella','Oregano','Tomato Base','Smoked Bacon')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Truffle Cream','Mushroom','Parmesan'),
  i.name = 'Mushroom',
  i.name = 'Smoked Bacon',
  CASE WHEN i.name = 'Smoked Bacon' THEN 1.50 END
FROM product p, ingredient i
WHERE p.name = 'Tartufo'
  AND i.name IN ('Truffle Cream','Mushroom','Parmesan','Smoked Bacon')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id, TRUE, i.name = 'Rosemary', FALSE, NULL
FROM product p, ingredient i
WHERE p.name = 'Rosemary Skin Fries'
  AND i.name IN ('Potatoes','Rosemary','Sea Salt')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Dark Chocolate','Brioche'),
  FALSE,
  i.name = 'Vanilla Ice Cream',
  CASE WHEN i.name = 'Vanilla Ice Cream' THEN 1.80 END
FROM product p, ingredient i
WHERE p.name = 'Molten Chocolate Bun'
  AND i.name IN ('Dark Chocolate','Brioche','Vanilla Ice Cream')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Merguez','Baguette','Red Onion'),
  i.name = 'Red Onion',
  i.name = 'Harissa',
  CASE WHEN i.name = 'Harissa' THEN 0.50 END
FROM product p, ingredient i
WHERE p.name = 'Merguez Sandwich'
  AND i.name IN ('Merguez','Baguette','Red Onion','Harissa')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient
  (id_product, id_ingredient, is_ingredient, is_removable, is_supplementaire, price_supplementaire)
SELECT p.id, i.id,
  i.name IN ('Chicken Thigh','Flatbread','Lettuce'),
  i.name = 'Lettuce',
  i.name IN ('Garlic Sauce','Harissa'),
  CASE WHEN i.name = 'Garlic Sauce' THEN 0.70 WHEN i.name = 'Harissa' THEN 0.50 END
FROM product p, ingredient i
WHERE p.name = 'Chicken Kebab Wrap'
  AND i.name IN ('Chicken Thigh','Flatbread','Lettuce','Garlic Sauce','Harissa')
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- 8. Offers
-- ===========================================================================
INSERT INTO offer (title, type, price, discount_percent, availability_window, applies_to_whole_menu, is_active)
SELECT 'Ember Family Pack', 'PACK', 42.00, 20, 'All week', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM offer WHERE title = 'Ember Family Pack');

INSERT INTO offer_product (id_offer, id_product, quantity)
SELECT o.id, p.id,
  CASE p.name
    WHEN 'Double Smash Ember'  THEN 4
    WHEN 'Rosemary Skin Fries' THEN 2
    WHEN 'Smoked Cola 33cl'    THEN 4
  END
FROM offer o, product p
WHERE o.title = 'Ember Family Pack'
  AND p.name IN ('Double Smash Ember','Rosemary Skin Fries','Smoked Cola 33cl')
ON CONFLICT DO NOTHING;

INSERT INTO offer (title, type, price, discount_percent, availability_window, applies_to_whole_menu, is_active)
SELECT 'Late Night Smash', 'HAPPY_HOUR', 9.90, 30, '22:00 – 00:30', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM offer WHERE title = 'Late Night Smash');

INSERT INTO offer_product (id_offer, id_product, quantity)
SELECT o.id, p.id, 1
FROM offer o, product p
WHERE o.title = 'Late Night Smash'
  AND p.name IN ('Double Smash Ember','Rosemary Skin Fries')
ON CONFLICT DO NOTHING;

INSERT INTO offer (title, type, price, discount_percent, availability_window, applies_to_whole_menu, is_active)
SELECT 'Student Tuesday', 'DISCOUNT', NULL, 15, 'Tuesdays', TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM offer WHERE title = 'Student Tuesday');

-- ===========================================================================
-- 9. Sample orders (skipped gracefully if no USER account exists yet)
-- ===========================================================================
DO $$
DECLARE
  v_customer  BIGINT;
  v_mos_del   BIGINT;
  v_mos_dine  BIGINT;
  v_pm_cash   BIGINT;
  v_pm_card   BIGINT;
  v_p_smash   BIGINT;
  v_p_fries   BIGINT;
  v_p_cola    BIGINT;
  v_p_truffle BIGINT;
  v_order_id  BIGINT;
BEGIN
  SELECT id INTO v_customer FROM users WHERE role = 'USER' LIMIT 1;
  IF v_customer IS NULL THEN
    RAISE NOTICE 'No USER account found — skipping sample orders. Register an account first, then re-run this file.';
    RETURN;
  END IF;

  SELECT id INTO v_mos_del  FROM method_of_sale WHERE code = 'DELIVERY';
  SELECT id INTO v_mos_dine FROM method_of_sale WHERE code = 'DINE_IN';
  SELECT id INTO v_pm_cash  FROM payment_method  WHERE code = 'CASH';
  SELECT id INTO v_pm_card  FROM payment_method  WHERE code = 'CARD';
  SELECT id INTO v_p_smash   FROM product WHERE name = 'Double Smash Ember';
  SELECT id INTO v_p_fries   FROM product WHERE name = 'Rosemary Skin Fries';
  SELECT id INTO v_p_cola    FROM product WHERE name = 'Smoked Cola 33cl';
  SELECT id INTO v_p_truffle FROM product WHERE name = 'Truffle Melt Deluxe';

  -- Order 1: delivery, completed
  INSERT INTO orders
    (order_number, id_customer, id_method_of_sale, id_payment_method,
     order_status, payment_status, total, created_at)
  VALUES
    ('EB-SAMPLE01', v_customer, v_mos_del, v_pm_cash,
     'COMPLETED', 'PAID', 27.00, now() - INTERVAL '3 days')
  ON CONFLICT (order_number) DO NOTHING
  RETURNING id INTO v_order_id;

  IF v_order_id IS NOT NULL THEN
    INSERT INTO order_item (id_order, id_product, quantity, unit_price, total_price)
    VALUES (v_order_id, v_p_smash, 2, 13.50, 27.00);
  END IF;

  -- Order 2: dine-in, completed
  INSERT INTO orders
    (order_number, id_customer, id_method_of_sale, id_payment_method,
     order_status, payment_status, total, created_at)
  VALUES
    ('EB-SAMPLE02', v_customer, v_mos_dine, v_pm_card,
     'COMPLETED', 'PAID', 41.60, now() - INTERVAL '7 days')
  ON CONFLICT (order_number) DO NOTHING
  RETURNING id INTO v_order_id;

  IF v_order_id IS NOT NULL THEN
    INSERT INTO order_item (id_order, id_product, quantity, unit_price, total_price)
    VALUES
      (v_order_id, v_p_smash, 2,  13.50, 27.00),
      (v_order_id, v_p_fries, 2,   4.50,  9.00),
      (v_order_id, v_p_cola,  2,   2.80,  5.60);
  END IF;

  -- Order 3: delivery, in progress
  INSERT INTO orders
    (order_number, id_customer, id_method_of_sale, id_payment_method,
     order_status, payment_status, total, created_at)
  VALUES
    ('EB-SAMPLE03', v_customer, v_mos_del, v_pm_cash,
     'PREPARING', 'PENDING', 15.00, now() - INTERVAL '20 minutes')
  ON CONFLICT (order_number) DO NOTHING
  RETURNING id INTO v_order_id;

  IF v_order_id IS NOT NULL THEN
    INSERT INTO order_item (id_order, id_product, quantity, unit_price, total_price)
    VALUES (v_order_id, v_p_truffle, 1, 15.00, 15.00);
  END IF;

END;
$$;

COMMIT;

-- Row counts summary
SELECT
  (SELECT COUNT(*) FROM division)     AS divisions,
  (SELECT COUNT(*) FROM category)     AS categories,
  (SELECT COUNT(*) FROM ingredient)   AS ingredients,
  (SELECT COUNT(*) FROM product)      AS products,
  (SELECT COUNT(*) FROM offer)        AS offers,
  (SELECT COUNT(*) FROM dining_table) AS tables,
  (SELECT COUNT(*) FROM orders)       AS orders;
