-- Ember & Bun — PostgreSQL schema
-- Deliverable from fable5-users-auth-offers-division-brief.md
-- Run with: psql "$DATABASE_URL" -f server/db/schema.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('OWNER', 'SUPER_ADMIN', 'USER', 'DELIVERY');
CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE offer_type AS ENUM ('PACK', 'DISCOUNT', 'HAPPY_HOUR');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE order_status AS ENUM ('NEW', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED');
CREATE TYPE ingredient_action AS ENUM ('NORMAL', 'REMOVED', 'ADDED', 'SUPPLEMENT');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Users & support
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name               TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  phone              TEXT,
  password_hash      TEXT NOT NULL,
  role               user_role NOT NULL DEFAULT 'USER',
  avatar_url         TEXT,
  balance            NUMERIC(10, 2) NOT NULL DEFAULT 0,
  preferred_language TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Owner and Super Admin are singletons — enforced at the DB level.
CREATE UNIQUE INDEX one_owner ON users (role) WHERE role = 'OWNER';
CREATE UNIQUE INDEX one_super_admin ON users (role) WHERE role = 'SUPER_ADMIN';

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE support_ticket (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_user    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     ticket_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX support_ticket_user_idx ON support_ticket (id_user);

CREATE TRIGGER support_ticket_updated_at BEFORE UPDATE ON support_ticket
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Catalog: Division > Category (self-referencing) > Product + Ingredients
-- ---------------------------------------------------------------------------
CREATE TABLE division (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT NOT NULL,
  name_ar      TEXT,
  image        TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE category (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image        TEXT,
  -- Self-referencing parent: Burgers -> Beef/Chicken/Veggie, arbitrarily deep.
  id_category  BIGINT REFERENCES category (id) ON DELETE SET NULL,
  -- Stored directly on every category row, including subcategories.
  -- Keep a subcategory's division in sync with its parent's at the app layer.
  id_division  BIGINT NOT NULL REFERENCES division (id)
);

CREATE INDEX category_division_idx ON category (id_division);
CREATE INDEX category_parent_idx ON category (id_category);

CREATE TABLE ingredient (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE, -- one shared master list: "Cheddar" is one row
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image        TEXT
);

CREATE TABLE product (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image        TEXT,
  id_category  BIGINT NOT NULL REFERENCES category (id)
);

CREATE INDEX product_category_idx ON product (id_category);

-- Which ingredients are ELIGIBLE for products in a category (the filter step).
CREATE TABLE category_ingredient (
  id_category       BIGINT NOT NULL REFERENCES category (id) ON DELETE CASCADE,
  id_ingredient     BIGINT NOT NULL REFERENCES ingredient (id) ON DELETE CASCADE,
  is_ingredient     BOOLEAN NOT NULL DEFAULT FALSE,
  is_supplementaire BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id_category, id_ingredient)
);

-- Per-dish ingredient behavior. Flags can combine (standard + removable + paid extra).
CREATE TABLE product_ingredient (
  id_product           BIGINT NOT NULL REFERENCES product (id) ON DELETE CASCADE,
  id_ingredient        BIGINT NOT NULL REFERENCES ingredient (id) ON DELETE CASCADE,
  is_ingredient        BOOLEAN NOT NULL DEFAULT FALSE,
  is_supplementaire    BOOLEAN NOT NULL DEFAULT FALSE,
  is_removable         BOOLEAN NOT NULL DEFAULT FALSE,
  price_supplementaire NUMERIC(10, 2),
  PRIMARY KEY (id_product, id_ingredient)
);

-- ---------------------------------------------------------------------------
-- Offers
-- ---------------------------------------------------------------------------
CREATE TABLE offer (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title                 TEXT NOT NULL,
  type                  offer_type NOT NULL,
  price                 NUMERIC(10, 2),
  discount_percent      NUMERIC(5, 2),
  -- Unstructured for now ("All week", "22:00 – 00:30", "Tuesdays").
  -- Candidate to split into start_time / end_time / days_of_week later.
  availability_window   TEXT,
  applies_to_whole_menu BOOLEAN NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER offer_updated_at BEFORE UPDATE ON offer
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Real product references with quantity — "4x Double Smash" is
-- { id_product: <id>, quantity: 4 }, never a display string.
CREATE TABLE offer_product (
  id_offer   BIGINT NOT NULL REFERENCES offer (id) ON DELETE CASCADE,
  id_product BIGINT NOT NULL REFERENCES product (id) ON DELETE CASCADE,
  quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  PRIMARY KEY (id_offer, id_product)
);

-- ---------------------------------------------------------------------------
-- Ordering side
-- ---------------------------------------------------------------------------
CREATE TABLE method_of_sale (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE CHECK (code IN ('DINE_IN', 'TAKE_AWAY', 'DELIVERY')),
  name        TEXT NOT NULL,
  description TEXT
);

CREATE TABLE payment_method (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE CHECK (code IN ('CASH', 'CARD')),
  name        TEXT NOT NULL,
  description TEXT
);

-- Valid (method_of_sale, payment_method) combinations, enforced as data +
-- a composite FK from orders (e.g. delivery+card is simply not inserted here).
CREATE TABLE sale_payment_rule (
  id_method_of_sale BIGINT NOT NULL REFERENCES method_of_sale (id) ON DELETE CASCADE,
  id_payment_method BIGINT NOT NULL REFERENCES payment_method (id) ON DELETE CASCADE,
  PRIMARY KEY (id_method_of_sale, id_payment_method)
);

-- "TABLE" is a reserved word in SQL, hence dining_table.
CREATE TABLE dining_table (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  capacity     INT NOT NULL CHECK (capacity > 0),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

-- "ORDER" is a reserved word in SQL, hence orders.
CREATE TABLE orders (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number       TEXT NOT NULL UNIQUE,
  -- Nullable to cover guest checkout.
  id_customer        BIGINT REFERENCES users (id) ON DELETE SET NULL,
  -- Only for dine-in.
  id_table           BIGINT REFERENCES dining_table (id),
  id_method_of_sale  BIGINT NOT NULL REFERENCES method_of_sale (id),
  id_payment_method  BIGINT NOT NULL REFERENCES payment_method (id),
  -- Delivery is a real role now: record who is carrying the order.
  id_delivery_person BIGINT REFERENCES users (id),
  payment_status     payment_status NOT NULL DEFAULT 'PENDING',
  order_status       order_status NOT NULL DEFAULT 'NEW',
  total              NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Only combinations present in sale_payment_rule are accepted.
  FOREIGN KEY (id_method_of_sale, id_payment_method)
    REFERENCES sale_payment_rule (id_method_of_sale, id_payment_method)
);

CREATE INDEX orders_customer_idx ON orders (id_customer);
CREATE INDEX orders_delivery_person_idx ON orders (id_delivery_person);
CREATE INDEX orders_status_idx ON orders (order_status);

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- id_delivery_person must reference a user whose role is DELIVERY.
CREATE OR REPLACE FUNCTION check_delivery_person_role() RETURNS trigger AS $$
BEGIN
  IF NEW.id_delivery_person IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = NEW.id_delivery_person AND role = 'DELIVERY'
  ) THEN
    RAISE EXCEPTION 'id_delivery_person % is not a DELIVERY user', NEW.id_delivery_person;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_delivery_person_role
  BEFORE INSERT OR UPDATE OF id_delivery_person ON orders
  FOR EACH ROW EXECUTE FUNCTION check_delivery_person_role();

CREATE TABLE order_item (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_order    BIGINT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  -- A line is either a product or an offer pack (sold at the pack price).
  id_product  BIGINT REFERENCES product (id),
  id_offer    BIGINT REFERENCES offer (id),
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  -- Snapshot of the product price at order time — protects historical
  -- orders from later menu price changes.
  unit_price  NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  CONSTRAINT order_item_target_check CHECK (id_product IS NOT NULL OR id_offer IS NOT NULL)
);

CREATE INDEX order_item_order_idx ON order_item (id_order);

-- Snapshot of exactly what the customer did with each ingredient on that
-- specific line item, with its own frozen price if it was a paid add.
CREATE TABLE order_item_ingredient (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_order_item BIGINT NOT NULL REFERENCES order_item (id) ON DELETE CASCADE,
  id_ingredient BIGINT NOT NULL REFERENCES ingredient (id),
  action        ingredient_action NOT NULL DEFAULT 'NORMAL',
  price         NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX order_item_ingredient_item_idx ON order_item_ingredient (id_order_item);

COMMIT;
