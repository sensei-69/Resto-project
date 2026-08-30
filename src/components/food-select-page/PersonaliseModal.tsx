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
  return (
    <div className="fs-pers-panel" role="group" aria-label={`${food.name} products`}>
      <div className="fs-pers-panel-head">
        <button
          type="button"
          className="fs-pers-cancel"
          onClick={onCancelOrder}
          aria-label={`Close ${food.name} options`}
        >
          <X className="fs-pers-cancel-icon" strokeWidth={2.6} />
        </button>
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
    </div>
  );
}
