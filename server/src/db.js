import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

// Postgres returns BIGINT (int8) columns as strings by default, which breaks
// strict-equality id comparisons in the frontend (empty category dropdowns,
// false "not in this category" alerts). Ids fit safely in JS numbers here.
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => (value === null ? null : Number(value)));

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params);

/**
 * Idempotent, additive schema patches applied at boot so a database created
 * from an older schema.sql keeps working after a pull. Everything here must be
 * safe to run on every start (IF NOT EXISTS / WHERE NOT EXISTS guards).
 */
export async function ensureSchema() {
  await pool.query(`
    -- Offer packs as order lines (2026-09-10)
    ALTER TABLE order_item ALTER COLUMN id_product DROP NOT NULL;
    ALTER TABLE order_item ADD COLUMN IF NOT EXISTS id_offer BIGINT REFERENCES offer (id);
    ALTER TABLE order_item DROP CONSTRAINT IF EXISTS order_item_target_check;
    ALTER TABLE order_item
      ADD CONSTRAINT order_item_target_check CHECK (id_product IS NOT NULL OR id_offer IS NOT NULL);

    -- Starter dining tables so dine-in checkout has something to pick.
    INSERT INTO dining_table (table_number, capacity)
    SELECT n, CASE WHEN n <= 6 THEN 2 WHEN n <= 12 THEN 4 ELSE 6 END
    FROM generate_series(1, 14) AS n
    WHERE NOT EXISTS (SELECT 1 FROM dining_table);

    -- Saved card (masked snapshot only) and default delivery address (2026-09-11)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS card_holder TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS card_last4 TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS card_brand TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS card_expiry TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS default_address TEXT;

    -- Delivery address, cancellation audit and balance payments on orders
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS canceled_by BIGINT REFERENCES users (id);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_from_balance BOOLEAN NOT NULL DEFAULT FALSE;

    -- In-app notifications (customer feed + shared admin feed)
    CREATE TABLE IF NOT EXISTS notification (
      id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      id_user    BIGINT REFERENCES users (id) ON DELETE CASCADE,
      audience   TEXT NOT NULL DEFAULT 'USER' CHECK (audience IN ('USER', 'ADMIN')),
      type       TEXT NOT NULL,
      title      TEXT NOT NULL,
      body       TEXT,
      id_order   BIGINT REFERENCES orders (id) ON DELETE CASCADE,
      is_read    BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS notification_user_idx ON notification (id_user, is_read);
    CREATE INDEX IF NOT EXISTS notification_audience_idx ON notification (audience, created_at DESC);

    -- Card is accepted on every channel: checkout opens the card setup when
    -- the customer has none saved yet.
    INSERT INTO sale_payment_rule (id_method_of_sale, id_payment_method)
    SELECT ms.id, pm.id
    FROM method_of_sale ms CROSS JOIN payment_method pm
    WHERE NOT EXISTS (
      SELECT 1 FROM sale_payment_rule r
      WHERE r.id_method_of_sale = ms.id AND r.id_payment_method = pm.id
    );
  `);
}
