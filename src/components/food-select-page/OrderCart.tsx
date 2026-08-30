import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { CartLine, FoodItem } from "./types";

interface Props {
  lines: CartLine[];
  foodById: Map<string, FoodItem>;
  onQty: (lineId: string, delta: number) => void;
  onRemove: (lineId: string) => void;
  onAddOnQty: (lineId: string, addOnId: string, delta: number) => void;
  onClear: () => void;
}

function lineTotal(line: CartLine, food: FoodItem) {
  const extras = food.addOns.reduce((sum, a) => sum + a.price * (line.addOns[a.id] ?? 0), 0);
  return (food.price + extras) * line.qty;
}

export function OrderCart({ lines, foodById, onQty, onRemove, onAddOnQty, onClear }: Props) {
  const total = lines.reduce((sum, l) => {
    const food = foodById.get(l.foodId);
    return food ? sum + lineTotal(l, food) : sum;
  }, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <aside className="fs-cart" aria-label="Order cart">
      <header className="fs-cart-head">
        <div className="fs-cart-head-text">
          <span className="fs-cart-title">Your order</span>
          <span className="fs-cart-sub">
            {count} item{count === 1 ? "" : "s"}
          </span>
        </div>
        <div className="fs-cart-head-actions">
          <button
            className="fs-cart-clear"
            onClick={onClear}
            disabled={lines.length === 0}
            aria-label="Clear order"
            title="Clear order"
          >
            <X className="fs-cart-clear-icon" strokeWidth={2.5} />
          </button>
          <span className="fs-cart-bag">
            <ShoppingBag className="fs-cart-bag-icon" strokeWidth={2} />
            <span className="fs-cart-badge">{count}</span>
          </span>
        </div>
      </header>

      <div className="fs-cart-lines">
        {lines.length === 0 && (
          <div className="fs-cart-empty">
            <div className="fs-cart-empty-mark" />
            <p className="fs-cart-empty-text">No dish selected yet. Pick something tasty.</p>
          </div>
        )}

        {lines.map((line) => {
          const food = foodById.get(line.foodId);
          if (!food) return null;
          return (
            <div className="fs-cart-line" key={line.id}>
              <div className="fs-cart-line-top">
                <div className="fs-cart-thumb">
                  <img src={food.image} alt="" className="fs-cart-thumb-photo" />
                </div>
                <div className="fs-cart-line-text">
                  <div className="fs-cart-line-name">{food.name}</div>
                  <div className="fs-cart-line-price">${food.price.toFixed(2)}</div>
                  {line.removed.length > 0 && (
                    <div className="fs-cart-line-no">
                      no{" "}
                      {line.removed
                        .map((id) => food.ingredients.find((i) => i.id === id)?.name)
                        .join(", ")}
                    </div>
                  )}
                </div>
                <div className="fs-stepper">
                  <button
                    className="fs-step-btn"
                    onClick={() => onQty(line.id, -1)}
                    aria-label={`Decrease ${food.name}`}
                  >
                    <Minus className="fs-step-icon" strokeWidth={3} />
                  </button>
                  <span className="fs-step-val">{line.qty}</span>
                  <button
                    className="fs-step-btn"
                    onClick={() => onQty(line.id, 1)}
                    aria-label={`Increase ${food.name}`}
                  >
                    <Plus className="fs-step-icon" strokeWidth={3} />
                  </button>
                </div>
                <button
                  className="fs-cart-remove"
                  onClick={() => onRemove(line.id)}
                  aria-label={`Remove ${food.name}`}
                >
                  <Trash2 className="fs-cart-remove-icon" strokeWidth={2} />
                </button>
              </div>

              {food.addOns.length > 0 && (
                <div className="fs-addon-block">
                  <div className="fs-addon-label">Add-ons</div>
                  {food.addOns.map((addOn) => {
                    const qty = line.addOns[addOn.id] ?? 0;
                    return (
                      <div
                        className={qty > 0 ? "fs-addon fs-addon--on" : "fs-addon"}
                        key={addOn.id}
                      >
                        <span className="fs-addon-name">{addOn.name}</span>
                        <span className="fs-addon-price">+${addOn.price.toFixed(2)}</span>
                        <div className="fs-stepper fs-stepper--sm">
                          <button
                            className="fs-step-btn"
                            onClick={() => onAddOnQty(line.id, addOn.id, -1)}
                            aria-label={`Less ${addOn.name}`}
                          >
                            <Minus className="fs-step-icon" strokeWidth={3} />
                          </button>
                          <span className="fs-step-val">{qty}</span>
                          <button
                            className="fs-step-btn"
                            onClick={() => onAddOnQty(line.id, addOn.id, 1)}
                            aria-label={`More ${addOn.name}`}
                          >
                            <Plus className="fs-step-icon" strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="fs-cart-line-total">
                <span>Line total</span>
                <span className="fs-cart-line-total-val">${lineTotal(line, food).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="fs-cart-foot">
        <div className="fs-price-col">
          <div className="fs-price-number">${total.toFixed(2)}</div>
          <div className="fs-price-tag">Total</div>
        </div>
        <button className="fs-order-btn" disabled={lines.length === 0}>
          Order
        </button>
      </footer>
    </aside>
  );
}
