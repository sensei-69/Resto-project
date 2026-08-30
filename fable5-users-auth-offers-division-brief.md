# Blueprint for Fable 5 — Users, Auth, Offers, Division & Navbar

This is the second brief for this project ("Ember & Bun" — single-owner
restaurant ordering app, React + TypeScript + Vite, `react-router-dom`). The
first brief covered the catalog side (Category/Ingredient/Product + their
junction tables). This one covers everything that came up since: the roles
we'd missed, offers, a new Division layer, and two concrete UI bugs, plus
what's needed for auth and routing.

**Your mandate:** complete this work, don't just plan it. Implement every
fix below, wire the frontend to the schema, and if you find a page that
should exist but doesn't, add it; if you find something misconfigured
beyond what's listed here, fix it too — this list is what's been spotted
so far, not necessarily everything. For the database: prepare the table
definitions for PostgreSQL, structured for a Node.js backend. Actually
provisioning/running the database stays with the project owner — your job
is the schema, not standing up the instance.

## Roles (corrected)

This is **not** a multi-restaurant marketplace. One restaurant, four roles:
- **Owner** — the one restaurant operator (singleton)
- **Super Admin** — platform-level oversight above the Owner (singleton)
- **User** — the customer ordering food
- **Delivery** — the courier/rider

## 1. Users table + Auth

There's currently no `USERS` table and no auth context anywhere in the
codebase — `LoginPage.tsx` has a literal `// TODO: wire up authentication`
and does nothing with the form on submit. This needs building, not just
fixing.

**USERS**
- `id`, `name`, `email` (unique), `phone` (nullable), `password_hash`
- `role` (enum: `OWNER`, `SUPER_ADMIN`, `USER`, `DELIVERY`)
- `avatar_url` (nullable)
- `balance` (decimal, default 0) — powers the "Balance" item in the account
  dropdown described below
- `preferred_language` (nullable) — powers the "Language" dropdown item
- `is_active` (boolean, default true), `created_at`, `updated_at`

Since Owner and Super Admin are meant to be singletons, enforce that at the
DB level with a partial unique index rather than just app logic:
```sql
CREATE UNIQUE INDEX one_owner ON users (role) WHERE role = 'OWNER';
CREATE UNIQUE INDEX one_super_admin ON users (role) WHERE role = 'SUPER_ADMIN';
```

**SUPPORT_TICKET** — needed because the account dropdown (below) includes
"Write a ticket," which needs somewhere to go:
- `id`, `id_user` (FK → users), `subject`, `message`
- `status` (enum: `OPEN`, `IN_PROGRESS`, `CLOSED`)
- `created_at`, `updated_at`

**Auth flow to implement**
- Node/Postgres-backed auth: hash passwords (bcrypt), issue a JWT (or
  session) on login, store role on the token/session.
- A `RequireAuth` / `RequireRole` route-guard wrapper for React Router:
  redirect unauthenticated users away from any protected route to
  `/login`; redirect authenticated users with the wrong role away from
  role-specific routes.
- Default recommendation (adjust if you see a better fit given the rest of
  the codebase): keep one `/admin/*` dashboard shell and gate nav
  sections/pages by role inside it (Owner sees Menu/Offers/Orders/
  Analytics; Super Admin sees everything Owner sees plus platform-level
  settings) rather than duplicating a whole separate route tree — simpler
  for a single-restaurant app.
- Wire `RegisterPage.tsx`'s existing role step (`consumer`/`owner`/
  `courier`) through to real account creation — right now it collects the
  role but there's no auth backend to actually create the user.

## 2. Dish create/edit flow — the exact sequence to follow

This is the single most important fix in this brief, and it's what ties
the catalog model and the Division change together into one flow. Follow
this sequence exactly when building (or rebuilding) the add/edit-dish
form — don't treat category selection and ingredient selection as two
separate, unrelated fixes:

1. Admin opens "Add dish" (or "Edit dish"). They pick a **Division**
   first.
2. Picking a Division filters the **Category** dropdown down to only that
   division's categories (including subcategories, via CATEGORY's
   self-referencing parent). A category is required before anything else
   — a dish cannot exist without a resolved division + category.
3. Once a category is chosen, the ingredient panel populates from
   **CATEGORY_INGREDIENT** — only ingredients already marked eligible
   (`is_ingredient` / `is_supplementaire`) for that category are shown.
   Ingredients belonging to other categories must not appear as options.
   This is what "the admin must find the ingredients and categories
   concerned with this dish" means concretely: category first, then only
   that category's ingredients.
4. The admin attaches ingredients from that filtered list to the dish.
   Each attachment creates one **PRODUCT_INGREDIENT** row (referencing the
   shared INGREDIENT by id) with its own flags — `is_ingredient` (comes
   standard), `is_removable`, `is_supplementaire` + `price_supplementaire`
   — never a dish-local copy of a name string.
5. If an ingredient the admin needs isn't in the category's eligible list
   yet, they should not be able to freehand-type a new one straight into
   the dish. Either: (a) add it to the category's eligible list first (a
   `CATEGORY_INGREDIENT` row, via the category's own edit screen), or (b)
   offer a "quick add to this category" action inside the dish editor that
   writes the `CATEGORY_INGREDIENT` row before attaching it to the
   product. Either way, the ingredient must exist in the shared
   `INGREDIENT` table and be marked eligible for the category before it
   can land on a specific dish.
6. If the admin changes the dish's category mid-edit, re-filter the
   ingredient panel to the new category's eligible list, and flag any
   already-attached ingredients that aren't eligible under the new
   category — they need to be removed or the ingredient added to the new
   category's list.
7. Saving is blocked until the dish has a name, a resolved division +
   category, and a price. Ingredients are optional, but any that are
   present must trace back through this category-scoped path.

This replaces the current flat `Burgers/Sides/Drinks/Desserts` dropdown
and the global ingredient panel (both described in the next section) with
one connected picker: Division → Category → that category's Ingredients.

## 3. Fix: admin/menu ingredient panel isn't scoped to the dish

**Current state** (`src/admin/routes/admin.menu.tsx`): the right-hand
"Kitchen ingredients" panel lists every ingredient in one global
`ingredientLibrary` array, regardless of which category the dish being
edited belongs to. Clicking "Principal" or "Add-on" just pushes a
name-copied object into that dish's `principal`/`addons` array — there's no
shared ingredient record being referenced, so two dishes with "cheddar"
have two unrelated ingredient entries. Rebuild this panel to follow the
flow in section 2 above.

## 4. Fix: admin/offers — pick dishes by picture, not by typed name

**Current state** (`src/admin/routes/admin.offers.tsx` + `Offer` type in
`dashboard-data.ts`): the "Items included" list is text-only checkboxes
bound to `menuItems`, and — more importantly — the data model itself is
wrong. `Offer.items` is `string[]` holding baked-in display strings like
`"4x Double Smash"` and `"1x Any burger"`, and `"Whole menu"` is used as a
magic string rather than a real flag. None of this references an actual
product id, so renaming or deleting a dish silently breaks any offer that
mentions it, and there's no real quantity field — the "4x" is just typed
into the string.

**Fix**:
- Show each dish's picture (thumbnail) next to its name in the selection
  list, so the admin is choosing visually — matches the ask directly.
  `MenuItem` already has an optional `image` field (falls back to a
  category placeholder); make sure every seed dish has a real `image` set
  so the thumbnails aren't blank.
- Replace `Offer.items: string[]` with a proper `OFFER_PRODUCT` junction:
  `id_offer`, `id_product` (FK, not a name string), `quantity` (int,
  default 1) — this is what actually captures "4x Double Smash" as
  `{ id_product: <Double Smash's id>, quantity: 4 }`.
- Replace the `"Whole menu"` string convention with a real
  `applies_to_whole_menu` boolean on `OFFER` (that's the "Student Tuesday"
  case in the screenshot — a discount with no specific items, applied
  everywhere).

**OFFER**
- `id`, `title`, `type` (enum: `PACK`, `DISCOUNT`, `HAPPY_HOUR`)
- `price` (nullable decimal), `discount_percent` (nullable decimal)
- `availability_window` (text for now — e.g. "All week",
  "22:00 – 00:30", "Tuesdays"; fine to leave unstructured for now, but flag
  it as a candidate to later split into `start_time`/`end_time`/
  `days_of_week` if the admin ever needs to query/filter by it)
- `applies_to_whole_menu` (boolean, default false)
- `is_active` (boolean), `created_at`, `updated_at`

## 5. New table: Division (above Category)

The second screenshot shows a layer above what we called `CATEGORY`
earlier: **Starters (مقبلات)**, **Mains (أطباق رئيسية)**, **Sandwiches
(سندويش)**, etc. — each containing several categories (Starters →
Salads; Mains → Pizza, Traditional Tunisian, Grill; Sandwiches → Fast
Food, Burgers), and Burgers itself expands into Beef/Chicken/Veggie, which
is the self-referencing parent/child `CATEGORY` behavior already
established in the first brief. The screenshot's top filter
("Universal division") confirms Division sits above Category as a
separate table, not just another parent-category row.

**DIVISION**
- `id`, `name`, `name_ar` (the Arabic label shown alongside each English
  one — follow the same bilingual pattern for any other locales the app
  needs), `image`, `sort_order`, `is_available`

**CATEGORY** — add `id_division` (FK → DIVISION, required). Store it
directly on every category row (including subcategories) rather than only
on top-level categories and inferring it through the parent chain —
simpler to query, at the cost of needing to keep a subcategory's
`id_division` in sync with its parent's.

**Required UI change**: this is the Division → Category half of the flow
specified in section 2 — the add/edit-dish form in `admin.menu.tsx`
currently only has a flat `category` dropdown (hardcoded to
`Burgers/Sides/Drinks/Desserts`), with no Division layer at all.

**Side note, not a hard requirement**: the customer-facing menu
(`src/components/food-select-page/`) has its own separate hardcoded
category data (`FoodCategory`/`SubCategory` in `data.ts`) that's
independent of the admin's catalog data. It doesn't strictly need the
Division layer added today, but keep its shape consistent with whatever
Division/Category structure you build here — it'll need to consume the
same backend once one exists, and diverging shapes now means a rework
later.

## 6. Fix: Landing page — "My Space" / account button is auth-gated

There's currently no "My Space" button and no auth state in
`src/components/landing-page/Navbar.tsx` at all — the existing profile
icon just always navigates to `/login` regardless of whether anyone's
logged in. Build this from an `AuthContext` (or equivalent), and drive the
navbar off it:

- **Logged out**: no "My Space" button. Top-right shows an account/avatar
  icon; clicking it drops down **Login** / **Sign up** (to `/login` and
  `/register`).
- **Logged in**: top-right becomes "My Space," holding a notifications
  bell icon and the user's avatar. Clicking the avatar drops down:
  **Balance**, **Language**, **Write a ticket** (creates a
  `SUPPORT_TICKET` row via the table above), **Settings**, **Sign out**.

## Pages likely missing (add if confirmed missing)

A few things already have mock data sitting unused in `dashboard-data.ts`
(`myOrders`, `deliveries`, `riderWeek`, `trendingFoods`) with no page
consuming them yet — check whether these need building as part of
finishing the roles above:
- A **User** order-history page ("My Orders"), reachable from My Space
- A **Delivery** dashboard (assigned drops, weekly schedule/earnings)
- Wherever "Write a ticket" should land the user afterward (a simple
  ticket list/detail view, even minimal, so the action has somewhere to go)

## Database deliverable

Prepare PostgreSQL table definitions (SQL DDL, or a Prisma/knex schema if
that's the project's chosen ORM — check `package.json` for what's already
there before picking) for a Node.js backend. Deliver the schema only —
don't attempt to provision or run an actual Postgres instance; that's
staying on the project owner's side. Full table list, including what was
scoped in the first brief so this document is self-contained:

**From this brief**

- `users`, `support_ticket`, `division`, `offer`, `offer_product` — as
  defined above.

**Catalog side (carried over from the first brief, now with Division wired
into Category)**

- **CATEGORY** — `id`, `name`, `is_available`, `image`, `id_category`
  (nullable, FK to itself — the parent category, so Burgers/Sides/Drinks/
  Desserts can have subcategories under them, arbitrarily deep, without a
  separate `SUBCATEGORY` table), `id_division` (FK → DIVISION, required —
  added in this brief).
- **INGREDIENT** — `id`, `name`, `is_available`, `image`. One shared master
  list — "Cheddar" is one row, referenced by every dish that uses it, not
  retyped per dish.
- **PRODUCT** — `id`, `name`, `description`, `is_available`, `image`,
  `id_category` (FK, required — every dish belongs to exactly one
  category).
- **CATEGORY_INGREDIENT** (junction) — `id_category`, `id_ingredient`,
  `is_ingredient` / `is_supplementaire` (both boolean). Defines which
  ingredients are even eligible to be attached to products in that
  category — e.g. "Truffle mayo" can be offered on Burgers-category items
  but wouldn't appear as an option on Drinks. This is the filtering step
  before a specific product picks its ingredients.
- **PRODUCT_INGREDIENT** (junction) — `id_product`, `id_ingredient`,
  `is_ingredient`, `is_supplementaire`, `is_removable` (booleans) +
  `price_supplementaire` (decimal). The per-dish behavior. One row can be
  several of these flags at once — e.g. bacon on a burger could be
  `is_ingredient=true` (comes standard) and `is_removable=true` (customer
  can take it off) and `is_supplementaire=true` with a
  `price_supplementaire` (customer can also add a second portion for
  extra).

**Ordering side**

- **ORDER** — `id`, `order_number` (unique), `id_customer` (nullable, FK →
  users — nullable to cover guest checkout), `id_table` (nullable, FK →
  table — only for dine-in), `id_method_of_sale`, `id_payment_method`,
  `payment_status` (`PENDING`/`PAID`/`FAILED`/`REFUNDED`), `order_status`
  (`NEW`/`CONFIRMED`/`PREPARING`/`READY`/`COMPLETED`/`CANCELED`), `total`,
  `notes`, `created_at`, `updated_at`. **Also add `id_delivery_person`
  (nullable, FK → users where role = `DELIVERY`)** — the original diagram
  didn't have a rider/courier assignment field because it treated delivery
  as just a `method_of_sale` value, but Delivery is a real role now, so an
  order needs to record who's carrying it.
- **ORDER_ITEM** — `id`, `id_order`, `id_product`, `quantity`,
  `unit_price`, `total_price`. `unit_price` is a snapshot of the product's
  price at order time, protecting historical orders from later menu price
  changes.
- **ORDER_ITEM_INGREDIENT** — `id`, `id_order_item`, `id_ingredient`,
  `action` (`NORMAL`/`REMOVED`/`ADDED`/`SUPPLEMENT`), `price`. The snapshot
  of exactly what the customer did with each ingredient on that specific
  line item, with its own frozen price if it was a paid add.
- **METHOD_OF_SALE** (lookup) — `id`, `code`
  (`DINE_IN`/`TAKE_AWAY`/`DELIVERY`), `name`, `description`.
- **PAYMENT_METHOD** (lookup) — `id`, `code` (`CASH`/`CARD`), `name`,
  `description`.
- **TABLE** — `id`, `table_number`, `capacity`, `is_active`. Only relevant
  when `method_of_sale = DINE_IN`, hence the nullable `id_table` on
  `ORDER`.
- Also enforce the valid `(method_of_sale, payment_method)` combinations
  as a rule, not just an assumption — e.g. delivery+card isn't allowed yet.
  A small lookup/check-constraint table works, or an application-level
  validation layer if that's easier to keep in sync with the rest of the
  Node backend.
