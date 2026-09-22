/**
 * useCatalog — fetches the live catalog from the backend and maps it to the
 * FoodCategory / FoodItem shapes the existing UI components expect.
 *
 * Falls back to the static data.ts while loading or when the API is
 * unreachable (e.g. local dev without a running server).
 */
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { CATEGORIES, DIVISIONS } from "./data";
import type { FoodCategory, FoodItem, CategorySection } from "./types";

// ── Backend shapes ────────────────────────────────────────────────────────────

type ApiDivision = {
  id: number;
  name: string;
  name_ar: string | null;
  image: string | null;
  sort_order: number;
  is_available: boolean;
};

type ApiCategory = {
  id: number;
  name: string;
  image: string | null;
  is_available: boolean;
  id_division: number;
  id_category: number | null; // null = top-level, non-null = subcategory
};

type ApiIngredient = {
  id_ingredient: number;
  name: string;
  is_available: boolean;
  is_ingredient: boolean;
  is_supplementaire: boolean;
  is_removable: boolean;
  price_supplementaire: string | null;
};

type ApiProduct = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  image: string | null;
  is_available: boolean;
  id_category: number;
  ingredients: ApiIngredient[];
};

// ── Mapper ────────────────────────────────────────────────────────────────────

function placeholder(text: string, bg = "A80D25") {
  return `https://placehold.co/800x600/${bg}/FFFFFF?text=${encodeURIComponent(text)}`;
}

function mapProduct(p: ApiProduct): FoodItem {
  const allIngs = p.ingredients ?? [];
  const ingredients = allIngs.filter((i) => i.is_ingredient && i.is_removable);
  const addOns = allIngs.filter((i) => i.is_supplementaire);

  // A dish is unavailable when any of its principal ingredients is out of stock.
  const missingPrincipal = allIngs
    .filter((i) => i.is_ingredient && !i.is_available)
    .map((i) => i.name);
  const unavailable = missingPrincipal.length > 0;
  const unavailableReason = unavailable
    ? `Missing: ${missingPrincipal.join(", ")}`
    : undefined;

  return {
    id: `db-${p.id}`,
    name: p.name,
    subtitle: p.description ?? "",
    price: Number(p.price),
    image: p.image ?? placeholder(p.name),
    popularity: 50,
    unavailable,
    unavailableReason,
    ingredients: ingredients.map((i) => ({
      id: `ing-${i.id_ingredient}`,
      name: i.name,
      available: i.is_available,
    })),
    addOns: addOns.map((i) => ({
      id: `ao-${i.id_ingredient}`,
      name: i.name,
      price: Number(i.price_supplementaire ?? 0),
      available: i.is_available,
    })),
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export type CatalogState = {
  categories: FoodCategory[];
  sections: CategorySection[];
  allItems: FoodItem[];
  loading: boolean;
  error: string | null;
};

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    categories: CATEGORIES,
    sections: buildStaticSections(),
    allItems: flatItems(CATEGORIES),
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1. Fetch divisions and all categories in parallel.
        const [divRes, catRes] = await Promise.all([
          api<{ divisions: ApiDivision[] }>("/api/catalog/divisions"),
          api<{ categories: ApiCategory[] }>("/api/catalog/categories"),
        ]);

        const allApiCats = catRes.categories;

        // 2. Separate top-level categories from subcategories.
        const topLevel = allApiCats.filter((c) => c.id_category === null);
        const subLevel = allApiCats.filter((c) => c.id_category !== null);

        // 3. For each top-level category, fetch products for itself and its
        //    subcategories in parallel.
        const productFetches = allApiCats.map((c) =>
          api<{ products: ApiProduct[] }>(`/api/catalog/products?category=${c.id}`).then(
            (r) => ({ catId: c.id, products: r.products }),
          ),
        );
        const productResults = await Promise.all(productFetches);
        if (cancelled) return;

        const productsByCat = new Map<number, ApiProduct[]>();
        for (const r of productResults) productsByCat.set(r.catId, r.products);

        // 4. Fetch full product details (with ingredients) for every product.
        const allProductIds = productResults.flatMap((r) => r.products.map((p) => p.id));
        const uniqueIds = [...new Set(allProductIds)];
        const detailFetches = uniqueIds.map((id) =>
          api<{ product: ApiProduct }>(`/api/catalog/products/${id}`).then((r) => r.product),
        );
        const detailedProducts = await Promise.all(detailFetches);
        if (cancelled) return;

        const detailById = new Map<number, ApiProduct>();
        for (const p of detailedProducts) detailById.set(p.id, p);

        // 5. Build FoodCategory tree.
        //    A top-level category becomes a FoodCategory.
        //    Its subcategories (id_category = top.id) become SubCategories.
        //    If a top-level category has no subcategories, it gets one implicit
        //    subcategory named after itself.
        const subsByCat = new Map<number, ApiCategory[]>();
        for (const sub of subLevel) {
          const arr = subsByCat.get(sub.id_category!) ?? [];
          arr.push(sub);
          subsByCat.set(sub.id_category!, arr);
        }

        const foodCategories: FoodCategory[] = topLevel
          .filter((c) => c.is_available)
          .map((top) => {
            const subs = subsByCat.get(top.id) ?? [];

            const itemsOf = (catId: number) =>
              (productsByCat.get(catId) ?? [])
                .filter((p) => p.is_available)
                .map((p) => mapProduct(detailById.get(p.id) ?? p));

            const ownItems = itemsOf(top.id);
            const subSections = subs
              .filter((s) => s.is_available)
              .map((sub) => ({ id: `db-sub-${sub.id}`, name: sub.name, items: itemsOf(sub.id) }));

            // A parent without sub-categories acts as its own single section
            // (even with no dish yet). When it has sub-categories *and* dishes
            // attached directly, those dishes get a section named after it.
            const subcategories =
              subSections.length === 0 || ownItems.length > 0
                ? [{ id: `db-sub-${top.id}`, name: top.name, items: ownItems }, ...subSections]
                : subSections;

            return {
              id: `db-cat-${top.id}`,
              name: top.name,
              subtitle: "",
              image: top.image ?? placeholder(top.name),
              subcategories,
            };
          });
        // Categories without dishes are kept so newly created ones show up
        // immediately; the grid renders an empty state for them.

        // 6. Build CategorySection list from divisions.
        const catById = new Map(foodCategories.map((c) => [c.id, c]));


        const used = new Set<string>();
        const sections: CategorySection[] = divRes.divisions
          .filter((d) => d.is_available)
          .map((div) => {
            const cats = topLevel
              .filter((c) => c.id_division === div.id)
              .map((c) => catById.get(`db-cat-${c.id}`))
              .filter((c): c is FoodCategory => Boolean(c));
            cats.forEach((c) => used.add(c.id));
            return {
              id: `div-${div.id}`,
              label: div.name,
              arabic: div.name_ar ?? undefined,
              categories: cats,
            };
          })
          .filter((s) => s.categories.length > 0);

        const rest = foodCategories.filter((c) => !used.has(c.id));
        if (rest.length > 0) {
          sections.push({ id: "more", label: "More", arabic: "", categories: rest });
        }

        // If the DB is empty, fall back to static data.
        if (foodCategories.length === 0) {
          setState({
            categories: CATEGORIES,
            sections: buildStaticSections(),
            allItems: flatItems(CATEGORIES),
            loading: false,
            error: null,
          });
          return;
        }

        setState({
          categories: foodCategories,
          sections,
          allItems: flatItems(foodCategories),
          loading: false,
          error: null,
        });
      } catch {
        if (cancelled) return;
        // API unreachable — silently fall back to static data.
        setState({
          categories: CATEGORIES,
          sections: buildStaticSections(),
          allItems: flatItems(CATEGORIES),
          loading: false,
          error: null,
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flatItems(cats: FoodCategory[]): FoodItem[] {
  return cats.flatMap((c) => c.subcategories.flatMap((s) => s.items));
}

function buildStaticSections(): CategorySection[] {
  const used = new Set<string>();
  const grouped = DIVISIONS.map((d) => {
    const categories = d.categoryIds
      .map((id) => CATEGORIES.find((c) => c.id === id))
      .filter((c): c is FoodCategory => Boolean(c));
    categories.forEach((c) => used.add(c.id));
    return { id: d.id, label: d.label, arabic: d.arabic, categories };
  }).filter((s) => s.categories.length > 0);
  const rest = CATEGORIES.filter((c) => !used.has(c.id));
  if (rest.length > 0) grouped.push({ id: "more", label: "More", arabic: "", categories: rest });
  return grouped;
}
