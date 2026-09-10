import { Check, X } from "lucide-react";
import { ORDER_STEPS, money, stepLabel, type Order, type OrderItem } from "../lib/orders";

/** Horizontal step tracker: Received > Confirmed > Preparing > Ready > Completed. */
export function OrderProgress({ order, compact = false }: { order: Order; compact?: boolean }) {
  if (order.order_status === "CANCELED") {
    return (
      <div className="inline-flex items-center gap-2 rounded-[6px] border border-ink/10 bg-ink/5 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
        <X className="h-3.5 w-3.5" strokeWidth={3} /> Order cancelled
      </div>
    );
  }

  const current = ORDER_STEPS.indexOf(order.order_status);
  const last = ORDER_STEPS.length - 1;

  return (
    <ol className="flex w-full items-start" aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="relative flex flex-1 flex-col items-center gap-1.5">
            {i < last ? (
              <span
                aria-hidden
                className={`absolute left-1/2 top-3 h-[2px] w-full -translate-y-1/2 ${
                  done ? "bg-success" : "bg-cream-3"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold ${
                done
                  ? "bg-success text-cream-1"
                  : active
                    ? "bg-brand text-cream-1 ring-4 ring-brand/15"
                    : "bg-cream-3 text-ink-muted"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
            {!compact ? (
              <span
                className={`text-center text-[9px] font-extrabold uppercase tracking-[0.1em] ${
                  active ? "text-brand" : done ? "text-success" : "text-ink-muted"
                }`}
              >
                {stepLabel(order, step)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function groupExtras(list: OrderItem["ingredients"]) {
  const map = new Map<string, { name: string; qty: number; total: number }>();
  for (const e of list) {
    const cur = map.get(e.name) ?? { name: e.name, qty: 0, total: 0 };
    cur.qty += 1;
    cur.total += Number(e.price);
    map.set(e.name, cur);
  }
  return [...map.values()];
}

/** Line items of an order, with removed ingredients and paid extras under each dish. */
export function OrderItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
          <th className="pb-2 text-left">Item</th>
          <th className="pb-2 text-right">Qty</th>
          <th className="pb-2 text-right">Unit</th>
          <th className="pb-2 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const removed = item.ingredients.filter((i) => i.action === "REMOVED");
          const extras = groupExtras(
            item.ingredients.filter((i) => i.action === "ADDED" || i.action === "SUPPLEMENT"),
          );
          return (
            <tr key={item.id} className="border-t border-border/50 align-top">
              <td className="py-1.5">
                <p className="font-medium text-ink">
                  {item.name}
                  {item.id_offer ? (
                    <span className="ml-1.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-brand">
                      pack
                    </span>
                  ) : null}
                </p>
                {removed.length > 0 ? (
                  <p className="text-[11px] text-ink-muted">no {removed.map((r) => r.name).join(", ")}</p>
                ) : null}
                {extras.map((e) => (
                  <p key={e.name} className="text-[11px] text-ink-muted">
                    + {e.qty > 1 ? `${e.qty}\u00d7 ` : ""}
                    {e.name} ({money(e.total)})
                  </p>
                ))}
              </td>
              <td className="py-1.5 text-right text-ink-secondary">{item.quantity}</td>
              <td className="py-1.5 text-right text-ink-secondary">{money(item.unit_price)}</td>
              <td className="py-1.5 text-right font-bold text-ink">{money(item.total_price)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
