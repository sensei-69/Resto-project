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
  `);
}
