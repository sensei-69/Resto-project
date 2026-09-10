import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Bike,
  ChevronLeft,
  CreditCard,
  Loader2,
  LogIn,
  Store,
  Users,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { money, type CheckoutOptions, type Order, type SaleMethod } from "../lib/orders";
import type { CartLine, FoodItem } from "./food-select-page/types";

const METHOD_ICON: Record<string, LucideIcon> = {
  DINE_IN: UtensilsCrossed,
  TAKE_AWAY: Store,
  DELIVERY: Bike,
};
const PAYMENT_ICON: Record<string, LucideIcon> = { CASH: Banknote, CARD: CreditCard };

type ApiIngredient = { id_ingredient: number; action: "REMOVED" | "SUPPLEMENT"; quantity?: number };
type ApiItem = { id_product?: number; id_offer?: number; quantity: number; ingredients?: ApiIngredient[] };

/**
 * Cart lines reference catalog ids ("db-12"), ingredient ids ("ing-4"), add-on
 * ids ("ao-9") and offer packs ("offer-3"). Anything else is static demo data
 * that has no backend counterpart and cannot be ordered.
 */
function buildItems(lines: CartLine[], foodById: Map<string, FoodItem>) {
  const items: ApiItem[] = [];
  const unorderable: string[] = [];
  for (const line of lines) {
    const food = foodById.get(line.foodId);
    if (!food) continue;
    const product = /^db-(\d+)$/.exec(line.foodId);
    const offer = /^offer-(\d+)$/.exec(line.foodId);
    if (product) {
      const ingredients: ApiIngredient[] = [];
      for (const id of line.removed) {
        const m = /^ing-(\d+)$/.exec(id);
        if (m) ingredients.push({ id_ingredient: Number(m[1]), action: "REMOVED" });
      }
      for (const [id, qty] of Object.entries(line.addOns)) {
        const m = /^ao-(\d+)$/.exec(id);
        if (m && qty > 0) {
          ingredients.push({ id_ingredient: Number(m[1]), action: "SUPPLEMENT", quantity: qty });
        }
      }
      items.push({ id_product: Number(product[1]), quantity: line.qty, ingredients });
    } else if (offer) {
      items.push({ id_offer: Number(offer[1]), quantity: line.qty });
    } else {
      unorderable.push(food.name);
    }
  }
  return { items, unorderable };
}

function lineTotal(line: CartLine, food: FoodItem) {
  const extras = food.addOns.reduce((s, a) => s + a.price * (line.addOns[a.id] ?? 0), 0);
  return food.price * line.qty + extras;
}

interface Props {
  onBack: () => void;
  onPlaced: (order: Order) => void;
}

export function CheckoutPanel({ onBack, onPlaced }: Props) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { lines, foodById, cartTotal, clearLines, setIsCartOpen } = useCart();

  const [options, setOptions] = useState<CheckoutOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [method, setMethod] = useState<SaleMethod>("TAKE_AWAY");
  const [payment, setPayment] = useState("CASH");
  const [riderId, setRiderId] = useState<number | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<CheckoutOptions>("/api/orders/options")
      .then((o) => {
        if (!cancelled) setOptions(o);
      })
      .catch((err) => {
        if (!cancelled) {
          setOptionsError(err instanceof Error ? err.message : "Could not load checkout options");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allowedPayments = useMemo(
    () =>
      options
        ? options.rules.filter((r) => r.method_of_sale === method).map((r) => r.payment_method)
        : [],
    [options, method],
  );

  // Keep the payment choice valid for the selected channel (e.g. no card on delivery).
  useEffect(() => {
    if (allowedPayments.length > 0 && !allowedPayments.includes(payment)) {
      setPayment(allowedPayments[0]!);
    }
  }, [allowedPayments, payment]);

  const { items, unorderable } = useMemo(() => buildItems(lines, foodById), [lines, foodById]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const methodName = options?.methods_of_sale.find((m) => m.code === method)?.name ?? method;
  const tables = options?.tables ?? [];
  const riders = options?.riders ?? [];
  const needsTable = method === "DINE_IN" && tables.length > 0 && tableId === null;

  const canSubmit =
    Boolean(user) &&
    Boolean(options) &&
    items.length > 0 &&
    unorderable.length === 0 &&
    !needsTable;

  const submit = async () => {
    if (!user) {
      setIsCartOpen(false);
      navigate("/login", { state: { from: "/menu" } });
      return;
    }
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api<{ order: Order }>("/api/orders", {
        method: "POST",
        token,
        body: {
          items,
          method_of_sale: method,
          payment_method: payment,
          id_delivery_person: method === "DELIVERY" ? riderId : null,
          id_table: method === "DINE_IN" ? tableId : null,
          notes: notes.trim() || undefined,
        },
      });
      clearLines();
      onPlaced(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gc-checkout">
      <header className="gc-head">
        <button className="gc-back" onClick={onBack} aria-label="Back to cart">
          <ChevronLeft strokeWidth={2.5} />
        </button>
        <div className="gc-head-text">
          <span className="gc-title">Checkout</span>
          <span className="gc-sub">
            {count} item{count === 1 ? "" : "s"} \u00b7 {money(cartTotal)}
          </span>
        </div>
      </header>

      <div className="gc-body">
        {!user ? (
          <div className="gc-note">
            <LogIn />
            <span>Sign in to place your order and follow every step live on your dashboard.</span>
          </div>
        ) : null}

        {unorderable.length > 0 ? (
          <p className="gc-error">
            These demo dishes can&apos;t be ordered online: {unorderable.join(", ")}. Remove them
            from the cart to continue.
          </p>
        ) : null}

        <section className="gc-section">
          <h3>How do you want your food?</h3>
          {optionsError ? (
            <p className="gc-error">{optionsError}</p>
          ) : !options ? (
            <p className="gc-loading">
              <Loader2 className="gc-spin" /> Loading options\u2026
            </p>
          ) : (
            <div className="gc-options">
              {options.methods_of_sale.map((m) => {
                const Icon = METHOD_ICON[m.code] ?? Store;
                const on = method === m.code;
                return (
                  <button
                    key={m.code}
                    type="button"
                    className={`gc-option${on ? " gc-option--on" : ""}`}
                    onClick={() => setMethod(m.code)}
                    aria-pressed={on}
                  >
                    <Icon className="gc-option-icon" />
                    <span className="gc-option-name">{m.name}</span>
                    {m.description ? <span className="gc-option-desc">{m.description}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {options && method === "DELIVERY" ? (
          <section className="gc-section">
            <h3>Who brings it?</h3>
            {riders.length === 0 ? (
              <p className="gc-hint">
                No rider is online right now. We&apos;ll assign the first one available.
              </p>
            ) : (
              <div className="gc-list">
                <button
                  type="button"
                  className={`gc-row${riderId === null ? " gc-row--on" : ""}`}
                  onClick={() => setRiderId(null)}
                  aria-pressed={riderId === null}
                >
                  <Zap className="gc-row-icon" />
                  <span className="gc-row-text">
                    <span className="gc-row-name">First available rider</span>
                    <span className="gc-row-desc">Fastest option, assigned by the restaurant</span>
                  </span>
                </button>
                {riders.map((r) => {
                  const on = riderId === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className={`gc-row${on ? " gc-row--on" : ""}`}
                      onClick={() => setRiderId(r.id)}
                      aria-pressed={on}
                    >
                      <Bike className="gc-row-icon" />
                      <span className="gc-row-text">
                        <span className="gc-row-name">{r.name}</span>
                        <span className="gc-row-desc">Available now</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {options && method === "DINE_IN" ? (
          <section className="gc-section">
            <h3>Your table</h3>
            {tables.length === 0 ? (
              <p className="gc-hint">Tell us your table number in the notes below.</p>
            ) : (
              <div className="gc-tables">
                {tables.map((t) => {
                  const on = tableId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`gc-table${on ? " gc-table--on" : ""}`}
                      onClick={() => setTableId(on ? null : t.id)}
                      aria-pressed={on}
                      title={`Table ${t.table_number}, ${t.capacity} seats`}
                    >
                      <span className="gc-table-num">{t.table_number}</span>
                      <span className="gc-table-cap">
                        <Users /> {t.capacity}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {options ? (
          <section className="gc-section">
            <h3>Payment</h3>
            <div className="gc-options gc-options--2">
              {options.payment_methods.map((p) => {
                const Icon = PAYMENT_ICON[p.code] ?? Banknote;
                const allowed = allowedPayments.includes(p.code);
                const on = payment === p.code;
                return (
                  <button
                    key={p.code}
                    type="button"
                    className={`gc-option${on ? " gc-option--on" : ""}`}
                    onClick={() => setPayment(p.code)}
                    disabled={!allowed}
                    aria-pressed={on}
                    title={allowed ? undefined : `${p.name} is not available for ${methodName}`}
                  >
                    <Icon className="gc-option-icon" />
                    <span className="gc-option-name">{p.name}</span>
                    <span className="gc-option-desc">
                      {allowed ? p.description ?? "" : `Not for ${methodName.toLowerCase()}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="gc-section">
          <h3>Notes for the kitchen</h3>
          <textarea
            className="gc-notes"
            rows={3}
            maxLength={300}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Allergies, delivery instructions, anything we should know\u2026"
          />
        </section>

        <section className="gc-summary" aria-label="Order summary">
          {lines.map((l) => {
            const food = foodById.get(l.foodId);
            if (!food) return null;
            return (
              <div key={l.id} className="gc-summary-row">
                <span>
                  {l.qty}\u00d7 {food.name}
                </span>
                <span>{money(lineTotal(l, food))}</span>
              </div>
            );
          })}
          <div className="gc-summary-total">
            <span>Total</span>
            <span>{money(cartTotal)}</span>
          </div>
        </section>

        {error ? <p className="gc-error">{error}</p> : null}
      </div>

      <footer className="gc-foot">
        <button
          className="fs-order-btn gc-cta"
          onClick={() => void submit()}
          disabled={submitting || (Boolean(user) && !canSubmit)}
        >
          {submitting ? (
            <>
              <Loader2 className="gc-spin" /> Placing order\u2026
            </>
          ) : !user ? (
            "Sign in to order"
          ) : needsTable ? (
            "Pick your table"
          ) : (
            `Place order \u00b7 ${money(cartTotal)}`
          )}
        </button>
      </footer>
    </div>
  );
}
