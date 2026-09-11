import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check, CheckSquare, Plus, X } from "lucide-react";
import type { FoodItem, PendingUnit } from "./types";

interface Props {
  food: FoodItem;
  units: PendingUnit[];
  onAddUnit: () => void;
  onCancelOrder: () => void;
  onAcceptOrder: () => void;
  onRemoveUnit: (index: number) => void;
  onToggleRemoved: (index: number, ingredientId: string) => void;
  onToggleAddOn: (index: number, addOnId: string) => void;
}

function unitExtras(unit: PendingUnit, food: FoodItem) {
  return food.addOns.reduce((sum, a) => sum + a.price * (unit.addOns[a.id] ?? 0), 0);
}

/** Build a per-unit cost breakdown for the price sidebar. */
function buildBreakdown(units: PendingUnit[], food: FoodItem) {
  return units.map((unit, i) => {
    const activeAddOns = food.addOns
      .filter((a) => (unit.addOns[a.id] ?? 0) > 0)
      .map((a) => ({ name: a.name, qty: unit.addOns[a.id], total: a.price * unit.addOns[a.id] }));
    const extras = activeAddOns.reduce((s, a) => s + a.total, 0);
    return { index: i, base: food.price, addOns: activeAddOns, extras, subtotal: food.price + extras };
  });
}

export function PersonaliseModal({
  food,
  units,
  onAddUnit,
  onCancelOrder,
  onAcceptOrder,
  onRemoveUnit,
  onToggleRemoved,
  onToggleAddOn,
}: Props) {
  /* Lock body scroll while modal is open */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const breakdown = useMemo(() => buildBreakdown(units, food), [units, food]);
  const grandTotal = breakdown.reduce((s, b) => s + b.subtotal, 0);

  return createPortal(
    <div className="fs-pers-overlay" onClick={onCancelOrder}>
      <div
        className="fs-pers-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${food.name} products`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* -------- Hero image header -------- */}
        <div className="fs-pers-hero">
          <img src={food.image} alt={food.name} className="fs-pers-hero-img" />
          <div className="fs-pers-hero-scrim" />
          <div className="fs-pers-hero-info">
            <h2 className="fs-pers-hero-name">{food.name}</h2>
            <span className="fs-pers-hero-price">${food.price.toFixed(2)}</span>
          </div>
          <button
            type="button"
            className="fs-pers-hero-close"
            onClick={onCancelOrder}
            aria-label={`Close ${food.name} options`}
          >
            <X className="fs-pers-cancel-icon" strokeWidth={2.6} />
          </button>
        </div>

        <div className="fs-pers-panel-head">
          <button type="button" className="fs-pers-add" onClick={onAddUnit}>
            <Plus className="fs-pers-add-icon" strokeWidth={3} />
            Add {food.name}
          </button>
          <button
            type="button"
            className="fs-pers-accept"
            onClick={onAcceptOrder}
            aria-label={`Accept ${food.name} order`}
          >
            <CheckSquare className="fs-pers-cancel-icon" strokeWidth={2.6} />
          </button>
        </div>

        <div className="fs-pers-layout">
          {/* -------- Left: Customisation cards -------- */}
          <div className="fs-pers-body">
            {units.map((unit, index) => {
              const extras = unitExtras(unit, food);
              return (
                <section className="fs-pers-card" key={index}>
                  <div className="fs-pers-card-head">
                    {extras > 0 && <span className="fs-pers-fee">+${extras.toFixed(2)}</span>}
                    <h3 className="fs-pers-card-title">
                      #{index + 1} {food.name}
                    </h3>
                    <button
                      type="button"
                      className="fs-pers-card-close"
                      onClick={() => onRemoveUnit(index)}
                      aria-label={`Remove unit ${index + 1}`}
                    >
                      <X className="fs-pers-card-close-icon" strokeWidth={2.6} />
                    </button>
                  </div>

                  <div className="fs-pers-cols">
                    <div className="fs-pers-col">
                      <div className="fs-pers-col-label">Remove what you don&apos;t want</div>
                      <div className="fs-pers-chips">
                        {food.ingredients.map((ing) => {
                          const off = unit.removed.includes(ing.id);
                          return (
                            <button
                              key={ing.id}
                              type="button"
                              className={off ? "fs-ing-chip fs-ing-chip--off" : "fs-ing-chip"}
                              onClick={() => onToggleRemoved(index, ing.id)}
                              aria-pressed={off}
                            >
                              {off && <X className="fs-ing-x" strokeWidth={3} />}
                              {ing.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="fs-pers-col">
                      <div className="fs-pers-col-label">Adds on</div>
                      <div className="fs-pers-chips">
                        {food.addOns.map((addOn) => {
                          const on = (unit.addOns[addOn.id] ?? 0) > 0;
                          return (
                            <button
                              key={addOn.id}
                              type="button"
                              className={on ? "fs-ing-chip fs-ing-chip--on" : "fs-ing-chip"}
                              onClick={() => onToggleAddOn(index, addOn.id)}
                              aria-pressed={on}
                            >
                              {on && <Check className="fs-ing-x" strokeWidth={3} />}
                              {addOn.name}
                              <span className="fs-pers-chip-price">+${addOn.price.toFixed(2)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* -------- Right: Price summary -------- */}
          <aside className="fs-pers-prices" aria-label="Price summary">
            <div className="fs-pers-prices-title">Price Summary</div>

            <div className="fs-pers-prices-list">
              {breakdown.map((b) => (
                <div className="fs-pers-price-unit" key={b.index}>
                  <div className="fs-pers-price-unit-head">
                    <span className="fs-pers-price-label">#{b.index + 1} {food.name}</span>
                    <span className="fs-pers-price-val">${b.base.toFixed(2)}</span>
                  </div>

                  {b.addOns.map((a) => (
                    <div className="fs-pers-price-addon" key={a.name}>
                      <span className="fs-pers-price-addon-name">
                        + {a.name}{a.qty > 1 ? ` ×${a.qty}` : ""}
                      </span>
                      <span className="fs-pers-price-addon-val">${a.total.toFixed(2)}</span>
                    </div>
                  ))}

                  <div className="fs-pers-price-sub">
                    <span>Subtotal</span>
                    <span>${b.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="fs-pers-price-total">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>,
    document.body
  );
}

