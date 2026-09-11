# Ingredient Availability → Dish/Menu Impact

When an admin marks an ingredient as "not available" (out of stock), two things should happen on the customer menu (`/menu`):

1. **Principal ingredient out of stock** → The **entire dish becomes unavailable** (greyed out, un-orderable)
2. **Supplementaire (add-on) ingredient out of stock** → The dish stays available, but **that specific add-on is hidden or shown as unavailable**

## Current State (What Exists Today)

| Layer | What's there | What's missing |
|---|---|---|
| **DB** `ingredient` table | Has `is_available BOOLEAN` column ✅ | — |
| **DB** `product_ingredient` table | Has `is_ingredient` (principal) and `is_supplementaire` (add-on) flags ✅ | — |
| **Admin panel** | Toggle switch to set `is_available` on each ingredient ✅ | No visual feedback about which dishes are affected |
| **API** `GET /products/:id` | Returns ingredient list per product | ❌ Does **NOT** include `i.is_available` from the `ingredient` table |
| **Frontend** `useCatalog.ts` | Filters products by `p.is_available` | ❌ Never checks ingredient availability |
| **Frontend types** | `Ingredient { id, name }`, `AddOn { id, name, price }` | ❌ No `available` field on either type |
| **UI** `FoodGrid.tsx` / `PersonaliseModal.tsx` | Renders dishes and customisation | ❌ No "unavailable" visual state |

**Summary**: The admin can already toggle ingredient availability in the DB, but the information **never reaches the menu UI**. The API doesn't expose it, and the frontend doesn't consume it.

## Proposed Changes

The fix touches 4 layers: API → Frontend types → Data hook → UI components.

---

### 1. Server API — Expose ingredient availability

#### [MODIFY] [catalog.js](file:///c:/Users/LENOVO/Downloads/react_Vol2/react_Vol1/server/src/routes/catalog.js)

**`GET /products/:id`** (line ~334): Add `i.is_available` to the `json_build_object` so the frontend knows which ingredients are in/out of stock.

```diff
  json_build_object(
    'id_ingredient', pi.id_ingredient,
    'name', i.name,
+   'is_available', i.is_available,
    'is_ingredient', pi.is_ingredient,
    'is_supplementaire', pi.is_supplementaire,
    'is_removable', pi.is_removable,
    'price_supplementaire', pi.price_supplementaire
  )
```

---

### 2. Frontend types — Add availability fields

#### [MODIFY] [types.ts](file:///c:/Users/LENOVO/Downloads/react_Vol2/react_Vol1/src/components/food-select-page/types.ts)

- Add `available?: boolean` to `Ingredient` and `AddOn`
- Add `unavailable?: boolean` and `unavailableReason?: string` to `FoodItem`

---

### 3. Data hook — Compute dish availability from ingredient status

#### [MODIFY] [useCatalog.ts](file:///c:/Users/LENOVO/Downloads/react_Vol2/react_Vol1/src/components/food-select-page/useCatalog.ts)

In `mapProduct()`:
- Read `is_available` from each API ingredient
- If **any principal ingredient** (`is_ingredient && !is_available`) → mark the whole `FoodItem` as `unavailable: true` with reason like `"Missing: Cheddar, Beef patty"`
- For add-ons: pass `available: false` to those with `!is_available` so the UI can grey them out
- For removable ingredients: pass `available: false` so the UI can show them struck through

Also add the `is_available` field to the `ApiIngredient` type.

---

### 4. UI — Show unavailable state on dishes and ingredients

#### [MODIFY] [FoodGrid.tsx](file:///c:/Users/LENOVO/Downloads/react_Vol2/react_Vol1/src/components/food-select-page/FoodGrid.tsx)

- If `food.unavailable`, add a CSS class `fs-dish--unavailable` that greys out the card
- Show an overlay banner like "UNAVAILABLE" or the reason text
- Disable the click / ordering buttons for that dish

#### [MODIFY] [PersonaliseModal.tsx](file:///c:/Users/LENOVO/Downloads/react_Vol2/react_Vol1/src/components/food-select-page/PersonaliseModal.tsx)

- Add-on chips with `available === false`: render greyed out and disabled
- Removable ingredient chips with `available === false`: show "out of stock" label

#### [MODIFY] [FoodSelectUI.css](file:///c:/Users/LENOVO/Downloads/react_Vol2/react_Vol1/src/components/food-select-page/FoodSelectUI.css)

- `.fs-dish--unavailable` — reduced opacity, grayscale filter, "UNAVAILABLE" ribbon
- `.fs-ing-chip--oos` — out-of-stock styling for ingredient/add-on chips

## Open Questions

> [!IMPORTANT]
> **Should unavailable dishes be hidden entirely or shown greyed out?**
> Recommended: Show them greyed out with an "Unavailable" banner so customers can see the full menu but understand what's temporarily out. This is the standard restaurant app pattern.

> [!NOTE]
> **What about the admin panel?**
> Currently there's no indication of which dishes are affected when you toggle an ingredient. We could add a warning showing impacted products, but that's a follow-up enhancement — the core logic (block ordering) is the priority.

## Verification Plan

### Manual Verification
1. Admin panel: Toggle an ingredient (e.g. "Cheddar") to **not available**
2. Menu page: Any dish that has Cheddar as a **principal ingredient** should show greyed out with "Unavailable" banner
3. Menu page: Any dish that has Cheddar as an **add-on** should still be orderable, but the Cheddar add-on chip should be greyed out and disabled in the personalise modal
4. Toggle Cheddar back to available → dishes return to normal immediately on page refresh
