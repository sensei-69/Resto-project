-- Allow offer packs to be ordered as a single line and make the product
-- reference optional. For databases created before this change.
-- Run with: psql "$DATABASE_URL" -f server/db/migrations/2026-09-10_order_item_offer.sql

BEGIN;

ALTER TABLE order_item ALTER COLUMN id_product DROP NOT NULL;
ALTER TABLE order_item ADD COLUMN IF NOT EXISTS id_offer BIGINT REFERENCES offer (id);
ALTER TABLE order_item DROP CONSTRAINT IF EXISTS order_item_target_check;
ALTER TABLE order_item
  ADD CONSTRAINT order_item_target_check CHECK (id_product IS NOT NULL OR id_offer IS NOT NULL);

COMMIT;
