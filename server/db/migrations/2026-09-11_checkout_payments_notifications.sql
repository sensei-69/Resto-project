-- Checkout payments, delivery address, cancellation audit and notifications.
-- Also applied automatically at boot by ensureSchema() in server/src/db.js.

BEGIN;

-- Saved card: only a masked snapshot (holder, brand, last 4, expiry).
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_holder TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_last4 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_brand TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_expiry TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_address TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS canceled_by BIGINT REFERENCES users (id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_from_balance BOOLEAN NOT NULL DEFAULT FALSE;

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

-- Card on every channel.
INSERT INTO sale_payment_rule (id_method_of_sale, id_payment_method)
SELECT ms.id, pm.id
FROM method_of_sale ms CROSS JOIN payment_method pm
WHERE NOT EXISTS (
  SELECT 1 FROM sale_payment_rule r
  WHERE r.id_method_of_sale = ms.id AND r.id_payment_method = pm.id
);

COMMIT;
