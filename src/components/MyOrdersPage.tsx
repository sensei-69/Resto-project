import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  PackageCheck,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import {
  DashboardShell,
  PageHeader,
  Panel,
  Pill,
  StatCard,
  type NavItem,
} from "../admin/components/dashboard/shell";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, UtensilsCrossed } from "lucide-react";

const nav: NavItem[] = [
  { to: "/dashboard", label: "My space", icon: LayoutDashboard, exact: true },
  { to: "/my-orders", label: "My orders", icon: ShoppingBag, exact: true },
  { to: "/menu", label: "Order food", icon: UtensilsCrossed },
];

type OrderItem = {
  id_product: number;
  name: string;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
};

type Order = {
  id: number;
  order_number: string;
  order_status: string;
  payment_status: string;
  total: string | number;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
};

const STATUS_TONE: Record<string, "success" | "brand" | "neutral" | "muted"> = {
  COMPLETED: "success",
  CANCELED: "brand",
  NEW: "neutral",
  CONFIRMED: "neutral",
  PREPARING: "neutral",
  READY: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Delivered",
  CANCELED: "Cancelled",
};

export default function MyOrdersPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ orders: Order[] }>("/api/orders/mine", { token });
      setOrders(res.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const delivered = orders.filter((o) => o.order_status === "COMPLETED");
  const totalSpent = delivered.reduce((s, o) => s + Number(o.total), 0);

  return (
    <DashboardShell role="Customer" person={user?.name ?? ""} nav={nav}>
      <PageHeader
        eyebrow="Order history"
        title="My orders"
        description="Every order you've placed — tap a row to see the full breakdown."
      />

      {error ? (
        <div className="mb-4 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={String(orders.length)} icon={ShoppingBag} />
        <StatCard label="Delivered" value={String(delivered.length)} icon={PackageCheck} />
        <StatCard label="Total spent" value={`$${totalSpent.toFixed(2)}`} icon={Wallet} />
      </div>

      <div className="mt-4">
        <Panel title="All orders" hint={`${orders.length} orders`}>
          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
            </p>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-ink-muted" />
              <p className="mt-3 text-sm text-ink-muted">You haven't placed any orders yet.</p>
              <Link
                to="/menu"
                className="mt-4 inline-block rounded-[4px] bg-brand px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cream-1 hover:bg-brand/90"
              >
                Browse the menu
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const isOpen = expanded === order.id;
                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-[6px] border border-border"
                  >
                    <button
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-cream-2/60"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] font-bold text-ink-muted">
                          #{order.order_number}
                        </span>
                        <Pill tone={STATUS_TONE[order.order_status] ?? "neutral"}>
                          {STATUS_LABEL[order.order_status] ?? order.order_status}
                        </Pill>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-ink">
                          ${Number(order.total).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-ink-muted" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-ink-muted" />
                        )}
                      </div>
                    </button>

                    {isOpen ? (
                      <div className="border-t border-border bg-cream-2/40 px-4 py-3">
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
                            {order.items.map((item) => (
                              <tr key={item.id_product} className="border-t border-border/50">
                                <td className="py-1.5 font-medium text-ink">{item.name}</td>
                                <td className="py-1.5 text-right text-ink-secondary">{item.quantity}</td>
                                <td className="py-1.5 text-right text-ink-secondary">
                                  ${Number(item.unit_price).toFixed(2)}
                                </td>
                                <td className="py-1.5 text-right font-bold text-ink">
                                  ${Number(item.total_price).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {order.notes ? (
                          <p className="mt-2 text-[11px] text-ink-muted">Note: {order.notes}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
