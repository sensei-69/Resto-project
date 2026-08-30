export interface Ingredient {
  id: string;
  name: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface FoodItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  image: string;
  /** Popularity score used by the "most popular" sort. */
  popularity?: number;
  /** Base ingredients the user may opt out of. */
  ingredients: Ingredient[];
  /** Paid extras specific to this dish. */
  addOns: AddOn[];
}

export interface SubCategory {
  id: string;
  name: string;
  items: FoodItem[];
}

export interface FoodCategory {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  subcategories: SubCategory[];
}

/** A single pending unit of a dish, before it is passed to the cart. */
export interface PendingUnit {
  removed: string[];
  addOns: Record<string, number>;
}

/** Per-dish selection state held by the cart. */
export interface CartLine {
  id: string;
  foodId: string;
  qty: number;
  removed: string[];
  addOns: Record<string, number>;
}

/** Sort options for the dish grid. */
export type SortKey = "price-desc" | "price-asc" | "popular" | "favorite" | "alpha";

/** Sort options for the category rail. */
export type CategorySortKey = "universal" | "lucky" | "popular" | "favorite" | "alpha";

/** A labelled group of categories rendered in the rail. */
export interface CategorySection {
  id: string;
  label?: string;
  arabic?: string;
  categories: FoodCategory[];
}
