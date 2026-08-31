# Ember & Bun — Setup Guide

React + TypeScript + Vite frontend · Node/Express + PostgreSQL backend.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18 |
| npm | 9 |
| PostgreSQL | 14 |

---

## 1 — Create the database

Open a terminal and run:

```bash
psql -U postgres
```

Then inside the `psql` prompt:

```sql
CREATE DATABASE ember_bun;
-- Optional: create a dedicated user
CREATE USER ember_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE ember_bun TO ember_user;
\q
```

---

## 2 — Apply the schema

From the **project root**:

```bash
psql "postgres://ember_user:yourpassword@localhost:5432/ember_bun" \
  -f server/db/schema.sql
```

This creates all tables, enums, indexes, and triggers in a single transaction.

---

## 3 — Seed lookup data

The seed file inserts the required `method_of_sale`, `payment_method`,
`sale_payment_rule`, and starter `division` rows. It is **idempotent** — safe
to run multiple times.

```bash
psql "postgres://ember_user:yourpassword@localhost:5432/ember_bun" \
  -f server/db/seed.sql
```

---

## 4 — (Optional) Load sample data

To get a fully populated menu with categories, ingredients, products, offers,
tables, and example orders right away:

```bash
psql "postgres://ember_user:yourpassword@localhost:5432/ember_bun" \
  -f server/db/sample_data.sql
```

> **Note:** Run `seed.sql` first — `sample_data.sql` depends on the lookup
> rows it inserts.

---

## 5 — Configure the backend environment

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your values:

```env
DATABASE_URL=postgres://ember_user:yourpassword@localhost:5432/ember_bun
JWT_SECRET=replace-with-a-long-random-string
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 6 — Install dependencies and start the backend

```bash
cd server
npm install
npm run dev
```

Verify it is running:

```bash
curl http://localhost:3001/api/health
# → {"ok":true}
```

---

## 7 — Start the frontend

In a **separate terminal**, from the project root:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## 8 — Create privileged accounts

Register two accounts through the UI (or via `POST /api/auth/register`), then
promote them directly in the database:

```sql
-- Connect to the DB
psql "postgres://ember_user:yourpassword@localhost:5432/ember_bun"

-- Promote to Owner (singleton)
UPDATE users SET role = 'OWNER' WHERE email = 'owner@example.com';

-- Promote to Super Admin (singleton)
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'superadmin@example.com';
```

Owner and Super Admin are enforced as singletons by partial unique indexes —
only one row of each role can exist at a time.

---

## 9 — Create a delivery rider account

Register with `role: "courier"` from the Register page (or via the API).
The backend maps `courier` → `DELIVERY` automatically.

The rider's dashboard is at `/delivery` after login.

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret used to sign 7-day JWTs |
| `PORT` | ❌ | API port (default: `3001`) |
| `CORS_ORIGIN` | ❌ | Frontend origin allowed by CORS (default: `http://localhost:5173`) |
| `VITE_API_URL` | ❌ | Frontend env — API base URL (default: `http://localhost:3001`) |

Set `VITE_API_URL` in a `.env` file at the **project root** (not inside
`server/`) if your API runs on a different host or port:

```env
VITE_API_URL=http://localhost:3001
```

---

## Project structure

```
├── src/                        # React frontend
│   ├── admin/routes/           # Admin pages (overview, menu, offers, users)
│   ├── components/             # Customer pages + shared UI
│   │   ├── food-select-page/   # Live menu (useCatalog hook → /api/catalog)
│   │   ├── user-dashboard/     # Customer dashboard
│   │   ├── MyOrdersPage.tsx    # Order history (/my-orders)
│   │   ├── DeliveryDashboard.tsx # Rider console (/delivery)
│   │   └── TicketsPage.tsx     # Support tickets (/tickets)
│   └── context/
│       ├── AuthContext.tsx      # JWT session
│       └── CartContext.tsx      # Cart state
├── server/
│   ├── db/
│   │   ├── schema.sql          # Full DB schema
│   │   ├── seed.sql            # Lookup data (methods, rules, divisions)
│   │   └── sample_data.sql     # Example catalog + orders
│   └── src/
│       └── routes/             # Express routers
│           ├── auth.js
│           ├── catalog.js
│           ├── offers.js
│           ├── orders.js
│           ├── tickets.js
│           ├── users.js
│           └── analytics.js
└── fable5-users-auth-offers-division-brief.md
```

---

## API quick reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register (USER or DELIVERY) |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/catalog/divisions` | — | All divisions |
| GET | `/api/catalog/categories` | — | All categories (`?division=id`) |
| GET | `/api/catalog/products` | — | All products (`?category=id`) |
| GET | `/api/catalog/products/:id` | — | Product with ingredients |
| GET | `/api/offers` | — | Active offers with items |
| POST | `/api/orders` | Optional | Place an order (guest OK) |
| GET | `/api/orders/mine` | USER | My order history |
| GET | `/api/orders/assigned` | DELIVERY | Assigned drops |
| GET | `/api/tickets` | Bearer | My tickets (admin sees all) |
| POST | `/api/tickets` | Bearer | Submit a ticket |
| GET | `/api/analytics` | OWNER/SUPER_ADMIN | Revenue, top foods, feedback |
| GET | `/api/users` | SUPER_ADMIN | All users with order stats |
