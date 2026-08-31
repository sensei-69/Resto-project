import { createContext, useContext, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { CATEGORIES } from "../components/food-select-page/data";
import type { CartLine, FoodItem, PendingUnit } from "../components/food-select-page/types";

interface CartContextType {
  lines: CartLine[];
  pending: Record<string, PendingUnit[]>;
  favorites: string[];
  foodById: Map<string, FoodItem>;
  registerFood: (food: FoodItem) => void;
  committedByFood: Record<string, number>;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  
  toggleFavorite: (foodId: string) => void;
  dishClick: (food: FoodItem) => void;
  passFood: (food: FoodItem) => void;
  addToCartDirect: (food: FoodItem) => void;
  editFood: (food: FoodItem) => void;
  cancelFood: (foodId: string) => void;
  cancelPersonalisation: (foodId: string) => void;
  resetPending: (foodId: string) => void;
  removeUnit: (foodId: string, index: number) => void;
  toggleUnitRemoved: (foodId: string, index: number, ingredientId: string) => void;
  toggleUnitAddOn: (foodId: string, index: number, addOnId: string) => void;
  changeQty: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  clearLines: () => void;
  changeAddOnQty: (lineId: string, addOnId: string, delta: number) => void;
}

const CartContext = createContext<CartContextType | null>(null);

function signature(u: { removed: string[]; addOns: Record<string, number> }) {
  return JSON.stringify([[...u.removed].sort(), Object.entries(u.addOns).sort()]);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pending, setPending] = useState<Record<string, PendingUnit[]>>({});
  const [editBackups, setEditBackups] = useState<Record<string, CartLine[]>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [extraFoods, setExtraFoods] = useState<Record<string, FoodItem>>({});

  const foodById = useMemo(() => {
    const map = new Map<string, FoodItem>();
    for (const cat of CATEGORIES) {
      for (const sub of cat.subcategories) {
        for (const item of sub.items) map.set(item.id, item);
      }
    }
    for (const food of Object.values(extraFoods)) map.set(food.id, food);
    return map;
  }, [extraFoods]);

  /** Register a runtime food (e.g. an offer pack) so cart lines can resolve it. */
  function registerFood(food: FoodItem) {
    setExtraFoods((prev) => (prev[food.id] ? prev : { ...prev, [food.id]: food }));
  }

  /** How many units of each food are already committed (in cart lines). */
  const committedByFood = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of lines) {
      map[line.foodId] = (map[line.foodId] ?? 0) + line.qty;
    }
    return map;
  }, [lines]);

  function toggleFavorite(foodId: string) {
    setFavorites((prev) =>
      prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId],
    );
  }

  function dishClick(food: FoodItem) {
    setPending((prev) => ({
      ...prev,
      [food.id]: [...(prev[food.id] ?? []), { removed: [], addOns: {} }],
    }));
  }

  function passFood(food: FoodItem) {
    const units = pending[food.id] ?? [];
    if (units.length === 0) return;
    
    setLines((prev) => {
      let next = [...prev];
      for (const unit of units) {
        const sig = signature(unit);
        const existing = next.find((l) => l.foodId === food.id && signature(l) === sig);
        if (existing) {
          next = next.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
        } else {
          next = [
            ...next,
            {
              id: `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              foodId: food.id,
              qty: 1,
              removed: unit.removed,
              addOns: unit.addOns,
            },
          ];
        }
      }
      return next;
    });
    setPending((prev) => {
      const next = { ...prev };
      delete next[food.id];
      return next;
    });
    setEditBackups((prev) => {
      const next = { ...prev };
      delete next[food.id];
      return next;
    });
  }

  /** Directly add a food to cart lines (bypasses pending). */
  function addToCartDirect(food: FoodItem) {
    setLines((prev) => {
      const unit = { removed: [] as string[], addOns: {} as Record<string, number> };
      const sig = signature(unit);
      const existing = prev.find((l) => l.foodId === food.id && signature(l) === sig);
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
      }
      return [
        ...prev,
        {
          id: `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          foodId: food.id,
          qty: 1,
          removed: [],
          addOns: {},
        },
      ];
    });
  }

  /** Copy committed cart lines back into pending so the user can re-edit them. */
  function editFood(food: FoodItem) {
    const foodLines = lines.filter((l) => l.foodId === food.id);
    if (foodLines.length === 0) return;
    const units: PendingUnit[] = foodLines.flatMap((l) =>
      Array.from({ length: l.qty }, () => ({
        removed: [...l.removed],
        addOns: { ...l.addOns },
      })),
    );
    setEditBackups((prev) => ({ ...prev, [food.id]: foodLines }));
    setPending((prev) => ({
      ...prev,
      [food.id]: [...(prev[food.id] ?? []), ...units],
    }));
    // Remove from committed lines since they're now back in pending
    setLines((prev) => prev.filter((l) => l.foodId !== food.id));
  }

  /** Undo personalisation by restoring the backup lines and clearing pending. */
  function cancelPersonalisation(foodId: string) {
    const backup = editBackups[foodId];
    if (backup) {
      setLines((prev) => [...prev, ...backup]);
    }
    setPending((prev) => {
      const next = { ...prev };
      delete next[foodId];
      return next;
    });
    setEditBackups((prev) => {
      const next = { ...prev };
      delete next[foodId];
      return next;
    });
  }

  /** Cancel all pending and committed units for a food. */
  function cancelFood(foodId: string) {
    setPending((prev) => {
      const next = { ...prev };
      delete next[foodId];
      return next;
    });
    setLines((prev) => prev.filter((l) => l.foodId !== foodId));
  }

  function resetPending(foodId: string) {
    setPending((prev) => {
      const next = { ...prev };
      delete next[foodId];
      return next;
    });
  }

  function removeUnit(foodId: string, index: number) {
    setPending((prev) => {
      const units = (prev[foodId] ?? []).filter((_, i) => i !== index);
      const next = { ...prev };
      if (units.length === 0) {
        delete next[foodId];
      } else {
        next[foodId] = units;
      }
      return next;
    });
  }

  function toggleUnitRemoved(foodId: string, index: number, ingredientId: string) {
    setPending((prev) => ({
      ...prev,
      [foodId]: (prev[foodId] ?? []).map((u, i) =>
        i === index
          ? {
              ...u,
              removed: u.removed.includes(ingredientId)
                ? u.removed.filter((id) => id !== ingredientId)
                : [...u.removed, ingredientId],
            }
          : u,
      ),
    }));
  }

  function toggleUnitAddOn(foodId: string, index: number, addOnId: string) {
    setPending((prev) => ({
      ...prev,
      [foodId]: (prev[foodId] ?? []).map((u, i) => {
        if (i !== index) return u;
        const addOns = { ...u.addOns };
        if (addOns[addOnId]) delete addOns[addOnId];
        else addOns[addOnId] = 1;
        return { ...u, addOns };
      }),
    }));
  }

  function changeQty(lineId: string, delta: number) {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.id !== lineId) return [l];
        const qty = l.qty + delta;
        return qty < 1 ? [] : [{ ...l, qty }];
      }),
    );
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  }

  function clearLines() {
    setLines([]);
  }

  function changeAddOnQty(lineId: string, addOnId: string, delta: number) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const next = Math.max(0, (l.addOns[addOnId] ?? 0) + delta);
        const addOns = { ...l.addOns, [addOnId]: next };
        if (next === 0) delete addOns[addOnId];
        return { ...l, addOns };
      }),
    );
  }

  const cartCount = lines.reduce((s, l) => s + l.qty, 0);
  const cartTotal = lines.reduce((sum, l) => {
    const food = foodById.get(l.foodId);
    if (!food) return sum;
    const extras = food.addOns.reduce((s, a) => s + a.price * (l.addOns[a.id] ?? 0), 0);
    return sum + (food.price + extras) * l.qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        lines,
        pending,
        favorites,
        foodById,
        registerFood,
        committedByFood,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        toggleFavorite,
        dishClick,
        passFood,
        addToCartDirect,
        editFood,
        cancelFood,
        cancelPersonalisation,
        resetPending,
        removeUnit,
        toggleUnitRemoved,
        toggleUnitAddOn,
        changeQty,
        removeLine,
        clearLines,
        changeAddOnQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
