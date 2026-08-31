# Fable 5 — Users, Auth, Offers, Division: STATUS + REMAINING WORK

Updated status doc for "Ember & Bun" (React + TS + Vite + react-router-dom,
Node/Express + pg backend in `server/`). The original brief's completed items
have been removed; everything below is either context or still-to-do. Any
agent resuming: implement, don't just plan.

## Roles (context)

Single restaurant, four roles: **Owner** (singleton), **Super Admin**
(singleton, above Owner), **User** (customer), **Delivery** (courier).
Enforced in DB via partial unique indexes; public register only creates
USER/DELIVERY.

## DONE — do not redo

- **DB schema + seeds** (`server/db/schema.sql`, `seed.sql`, merged in !1):
  all tables from both briefs — users, support_ticket, division, category
  (division FK + self-parent), ingredient, product, category_ingredient,
  product_ingredient, offer (applies_to_whole_menu) + offer_product
  (product FK + quantity), method_of_sale/payment_method/sale_payment_rule
  (composite-FK combo enforcement, delivery+card excluded), dining_table,
  orders (id_delivery_person + role trigger), order_item,
  order_item_ingredient, updated_at triggers.
- **Backend** (`server/src/`, merged in !1): Express + pg, bcrypt + 7-day JWT.
  `POST /api/auth/register` (consumer→USER, courier→DELIVERY), `/login`,
  `/me`; `requireAuth`/`requireRole` middleware; tickets CRUD (role-scoped);
  catalog READ endpoints (divisions, categories?division=, category
  ingredients, products?category=, offers with items).
- **Frontend auth core** (merged in !2): `src/lib/api.ts` (VITE_API_URL,
  default http://localhost:3001), `src/context/AuthContext.tsx`
  (login/register/logout, token in localStorage `eb_token`, bootstrap via
  /me), `src/components/guards.tsx` (RequireAuth, RequireRole), App routes
  gated (/dashboard = any auth, /admin/* = OWNER/SUPER_ADMIN), LoginPage
  wired with role-based redirect.
- **Register + navbar** (merged in !3): RegisterPage creates real accounts
  via the API; landing Navbar is auth-gated — logged out: Login/Sign up
  dropdown; logged in: My Space (bell + avatar) with Balance, Language,
  Write a ticket (modal → POST /api/tickets), Settings, Sign out.
- **Backend write endpoints** (!5): catalog CRUD (division/category/
  ingredient/product; category division change cascades to subcategories;
  product writes enforce CATEGORY_INGREDIENT eligibility in a transaction;
  "quick add to this category" upsert; GET /products/:id returns ingredient
  flags), offers CRUD ({id_product, quantity} items, applies_to_whole_menu),
  orders (guest checkout, server-side price snapshots incl. supplement
  prices, sale/payment combo validation, GET /mine, GET /assigned, admin
  status/assign endpoints).
- **Dish editor** (!6): admin.menu.tsx rebuilt API-driven — Division →
  Category → CATEGORY_INGREDIENT-scoped ingredient panel; attachments
  reference shared ingredient ids with is_ingredient/is_removable/
  is_supplementaire + price_supplementaire; quick-add writes ingredient +
  category eligibility before attaching; category change mid-edit flags
  ineligible attachments ("Allow in category" or remove; save blocked);
  save requires name + division/category + price; product cards live-PATCH
  price/availability and DELETE via the API.
- **Offers UI** (!7): admin.offers.tsx rebuilt API-driven — picture-based
  dish picker with quantity steppers; offers created with real
  {id_product, quantity} items via /api/offers; explicit
  applies_to_whole_menu toggle replaces the "Whole menu" magic string;
  pause/activate/delete hit the API.

## Manual steps (project owner, not agent)

1. Provision Postgres; run `server/db/schema.sql` then `seed.sql`.
2. `cp server/.env.example server/.env` (DATABASE_URL, JWT_SECRET, CORS_ORIGIN).
3. `cd server && npm install && npm run dev` → check `/api/health`.
4. Register two accounts, then promote in SQL:
   `UPDATE users SET role='OWNER' WHERE email='...';` (same for SUPER_ADMIN).

## REMAINING WORK

### 4. Wire admin to real data (IN PROGRESS — branch fable5-admin-wiring, MR !8)

Done on the branch: users management API — GET /api/users (with
orders_count + total_spent aggregates), PATCH name/phone/is_active
(Owner/Super Admin only modifiable by themselves), DELETE (blocks self and
protected roles, 409 on FK refs); mounted at /api/users.
Still to do in this MR:
- shell.tsx "Sign out" link must call logout() (currently just a Link to /)
- admin.tsx: drive role/person from AuthContext; gate nav by role — Users
  section is Super Admin only per the brief (Owner: Overview/Menu/Offers)
- App.tsx: nest RequireRole(["SUPER_ADMIN"]) around /admin/users
- admin.users.tsx: rewrite off the appUsers mock onto /api/users
  (ban = is_active toggle; drop age/gender mock analytics)
Note: admin.index.tsx analytics stays mock for now — no analytics
endpoints exist yet; flag as follow-up.

### 5. Missing pages (mock data exists unused: myOrders, deliveries, riderWeek, trendingFoods)

- **My Orders** (User order history), reachable from My Space.
- **Delivery dashboard** (assigned drops, weekly schedule/earnings).
- **Ticket list/detail view** so "Write a ticket" has somewhere to land
  (GET /api/tickets already exists).

### 6. Side note (not hard requirement)

Customer-facing menu (`src/components/food-select-page/data.ts`) has its own
hardcoded FoodCategory/SubCategory shapes — keep consistent with
Division/Category when it starts consuming the backend; diverging shapes now
means rework later.
