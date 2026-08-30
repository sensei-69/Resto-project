import { ChevronDown, Heart, Search, X } from "lucide-react";
import { PersonaliseModal } from "./PersonaliseModal";
import type { FoodItem, PendingUnit } from "./types";

interface Props {
  subName: string;
  items: FoodItem[];
  searching: boolean;
  dishQuery: string;
  pending: Record<string, PendingUnit[]>;
  committed: Record<string, number>;

  favorites: string[];
  openDropId: string | null;
  onToggleFavorite: (foodId: string) => void;
  onDishClick: (food: FoodItem) => void;
  onAddPendingUnit: (food: FoodItem) => void;
  onPersonalise: (food: FoodItem) => void;
  onCancelOrder: (food: FoodItem) => void;
  onCancelPersonalisation: (food: FoodItem) => void;
  onAcceptOrder: (food: FoodItem) => void;
  onRemoveUnit: (food: FoodItem, index: number) => void;
  onToggleRemoved: (food: FoodItem, index: number, ingredientId: string) => void;
  onToggleAddOn: (food: FoodItem, index: number, addOnId: string) => void;
}

export function FoodGrid({
  subName,
  items,
  searching,
  dishQuery,
  pending,
  committed,

  favorites,
  openDropId,
  onToggleFavorite,
  onDishClick,
  onAddPendingUnit,
  onPersonalise,
  onCancelOrder,
  onCancelPersonalisation,
  onAcceptOrder,
  onRemoveUnit,
  onToggleRemoved,
  onToggleAddOn,
}: Props) {
  const title = searching ? `Results for "${dishQuery.trim()}"` : subName;

  return (
    <section className="fs-middle" aria-label={`${subName} dishes`}>
      <div className="fs-middle-head">
        <span className="fs-middle-title">{title}</span>
        {searching && (
          <span className="fs-middle-hint">
            {items.length} dish{items.length === 1 ? "" : "es"} found
          </span>
        )}
      </div>

      <div className="fs-food-grid">
        {items.length === 0 && (
          <div className="fs-dish-empty">
            <Search className="fs-dish-empty-icon" strokeWidth={1.5} />
            <p className="fs-dish-empty-text">
              {searching
                ? `No dishes found matching "${dishQuery.trim()}".`
                : "No dishes available in this section."}
            </p>
          </div>
        )}

        {items.map((food, i) => {
          const units = pending[food.id] ?? [];
          const count = units.length + (committed[food.id] ?? 0);
          const selected = count > 0;
          const fav = favorites.includes(food.id);
          const open = units.length > 0 && openDropId === food.id;

          return (
            <article
              key={food.id}
              className={[
                "fs-dish",
                selected ? "fs-dish--selected" : "",
                open ? "fs-dish--open" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <button
                type="button"
                className={fav ? "fs-dish-fav fs-dish-fav--on" : "fs-dish-fav"}
                onClick={() => onToggleFavorite(food.id)}
                aria-pressed={fav}
                aria-label={`${fav ? "Remove" : "Save"} ${food.name} ${fav ? "from" : "to"} favorites`}
              >
                <Heart className="fs-dish-fav-icon" strokeWidth={2.4} />
              </button>

              {selected && (
                <button
                  type="button"
                  className="fs-dish-cancel"
                  onClick={() => onCancelOrder(food)}
                  aria-label={`Cancel ${food.name} order`}
                >
                  <X className="fs-dish-cancel-icon" strokeWidth={3} />
                </button>
              )}

              <button
                type="button"
                className="fs-dish-photo-btn"
                onClick={() => onDishClick(food)}
                aria-pressed={selected}
              >
                <img src={food.image} alt={food.name} className="fs-dish-photo" />
                <span className="fs-dish-scrim" />
                <span className="fs-dish-name">{food.name}</span>
                <span className="fs-dish-price">${food.price.toFixed(2)}</span>
                {selected && <span className="fs-dish-counter">{count}</span>}
              </button>

              {selected && (
                <button
                  type="button"
                  className={open ? "fs-dish-drop fs-dish-drop--open" : "fs-dish-drop"}
                  onClick={() => onPersonalise(food)}
                  aria-expanded={open}
                  aria-label={`Show ${count} selected ${food.name}`}
                >
                  <span>
                    {count} product{count === 1 ? "" : "s"}
                  </span>
                  <ChevronDown className="fs-dish-drop-icon" strokeWidth={2.6} />
                </button>
              )}

              {open && (
                <PersonaliseModal
                  food={food}
                  units={units}
                  onAddUnit={() => onAddPendingUnit(food)}
                  onCancelOrder={() => onCancelPersonalisation(food)}
                  onAcceptOrder={() => onAcceptOrder(food)}
                  onRemoveUnit={(index) => onRemoveUnit(food, index)}
                  onToggleRemoved={(index, ingredientId) => onToggleRemoved(food, index, ingredientId)}
                  onToggleAddOn={(index, addOnId) => onToggleAddOn(food, index, addOnId)}
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
