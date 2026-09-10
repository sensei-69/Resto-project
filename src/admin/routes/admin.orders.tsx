import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bike,
  ChefHat,
  ClipboardList,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "../components/dashboard/shell";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { OrderItemsTable, OrderProgress } from "../../components/order-ui";
import {
  ORDER_STATUSES,
  PAYMENT_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  isActiveOrder,
  itemsSummary,
  money,
  nextStatus,
  statusLabel,
  stepLabel,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "../../lib/orders";

type Rider = { id: number; name: string; phone: string | null };
type Filter = "ACTIVE" | "ALL" | OrderStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ACTIVE", label: "Active" },
  { key: "ALL", label: "All" },
  ...ORDER_STATUSES.map((s) => ({ key: s as Filter, label: STATUS_LABEL[s] })),
];

const POLL_MS = 15_000;
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const [o, r] = await Promise.all([
          api<{ orders: Order[] }>("/api/orders", { token }),
          api<{ riders: Rider[] }>("/api/orders/riders", { token }),
        ]);
        setOrders(o.orders);
        setRiders(r.riders);
        setError(null);
      } catch (err) {
        if (!silent) setError(err instanceof Error ? err.message : "Could not load orders");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const replace = (order: Order) =>
    setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));

  const patch = async (order: Order, path: "status" | "assign", body: Record<string, unknown>) => {
    setBusy(order.id);
    setError(null);
    try {
      const res = await api<{ order: Order }>(`/api/orders/${order.id}/${path}`, {
        method: "PATCH",
        body,
        token,
      });
      replace(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const byFilter =
        filter === "ALL" || (filter === "ACTIVE" ? isActiveOrder(o) : o.order_status === filter);
      if (!byFilter) return false;
      if (!q) return true;
      return (
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_name ?? "guest").toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [orders, filter, query]);

  const active = orders.find((o) => o.id === selected) ?? visible[0];
  const next = active ? nextStatus(active.order_status) : null;

  const activeCount = orders.filter(isActiveOrder).length;
  const newCount = orders.filter((o) => o.order_status === "NEW").length;
  const today = orders.filter((o) => isToday(o.created_at) && o.order_status !== "CANCELED");
  const todayRevenue = today.reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <PageHeader
        eyebrow="Kitchen"
        title="Orders"
        description="Every order coming in, live. Confirm, cook, hand over and assign riders from here."
        action={
          <button
            onClick={() => void load()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-[4px] border border-border bg-cream-1 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-secondary hover:border-brand hover:text-brand disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active orders" value={loading ? "\u2014" : String(activeCount)} icon={ChefHat} />
        <StatCard
          label="Awaiting confirmation"
          value={loading ? "\u2014" : String(newCount)}
          icon={ClipboardList}
        />
        <StatCard label="Orders today" value={loading ? "\u2014" : String(today.length)} icon={ShoppingBag} />
        <StatCard label="Revenue today" value={loading ? "\u2014" : money(todayRevenue)} icon={Banknote} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Order board" hint={`${visible.length} shown`}>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1 rounded-[4px] border border-border bg-cream-1 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-[3px] px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors ${
                    filter === f.key ? "bg-brand text-cream-1" : "text-ink-muted hover:bg-cream-2"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order #, customer or dish"
                className="login-field"
              />
            </div>
          </div>

          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading orders\u2026
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                    <th className="py-2.5 pr-3">Order</th>
                    <th className="py-2.5 pr-3">Customer</th>
                    <th className="py-2.5 pr-3">Items</th>
                    <th className="py-2.5 pr-3">Channel</th>
                    <th className="py-2.5 pr-3">Total</th>
                    <th className="py-2.5 pr-3">Payment</th>
                    <th className="py-2.5 pr-3">Status</th>
                    <th className="py-2.5 text-right">Next</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => {
                    const step = nextStatus(o.order_status);
                    return (
                      <tr
                        key={o.id}
                        onClick={() => setSelected(o.id)}
                        className={`cursor-pointer border-b border-border/70 text-sm transition-colors hover:bg-cream-2/70 ${
                          active?.id === o.id ? "bg-cream-2" : ""
                        }`}
                      >
                        <td className="py-3 pr-3">
                          <p className="font-mono text-[11px] font-bold text-ink">#{o.order_number}</p>
                          <p className="text-[11px] text-ink-muted">
                            {new Date(o.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {!isToday(o.created_at)
                              ? ` \u00b7 ${new Date(o.created_at).toLocaleDateString()}`
                              : ""}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-ink">{o.customer_name ?? "Guest"}</p>
                          {o.delivery_person_name ? (
                            <p className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                              <Bike className="h-3 w-3" /> {o.delivery_person_name}
                            </p>
                          ) : null}
                        </td>
                        <td className="max-w-[220px] py-3 pr-3 text-[12px] text-ink-secondary">
                          <p className="truncate" title={itemsSummary(o)}>
                            {itemsSummary(o)}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <Pill tone="neutral">
                            {o.method_of_sale_name}
                            {o.table_number ? ` ${o.table_number}` : ""}
                          </Pill>
                        </td>
                        <td className="py-3 pr-3 font-semibold text-ink">{money(o.total)}</td>
                        <td className="py-3 pr-3">
                          <Pill tone={PAYMENT_TONE[o.payment_status]}>
                            {PAYMENT_LABEL[o.payment_status]}
                          </Pill>
                        </td>
                        <td className="py-3 pr-3">
                          <Pill tone={STATUS_TONE[o.order_status]}>{statusLabel(o)}</Pill>
                        </td>
                        <td className="py-3 text-right">
                          {step ? (
                            <button
                              disabled={busy === o.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void patch(o, "status", { order_status: step });
                              }}
                              className="inline-flex items-center gap-1 rounded-[4px] border border-border bg-cream-1 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-secondary hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {busy === o.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ArrowRight className="h-3 w-3" />
                              )}
                              {stepLabel(o, step)}
                            </button>
                          ) : (
                            <span className="text-[11px] text-ink-muted">\u2014</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visible.length === 0 ? (
                <p className="py-3 text-sm text-ink-muted">No order matches this view.</p>
              ) : null}
            </div>
          )}
        </Panel>

        <Panel
          title="Order details"
          hint={active ? new Date(active.created_at).toLocaleString() : ""}
        >
          {active ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-bold text-ink-muted">#{active.order_number}</p>
                  <p className="mt-1 text-lg font-extrabold text-ink">{active.customer_name ?? "Guest"}</p>
                  {active.customer_email || active.customer_phone ? (
                    <p className="text-[11px] text-ink-muted">
                      {[active.customer_email, active.customer_phone].filter(Boolean).join(" \u00b7 ")}
                    </p>
                  ) : null}
                </div>
                <Pill tone={STATUS_TONE[active.order_status]}>{statusLabel(active)}</Pill>
              </div>

              <OrderProgress order={active} />

              <div className="flex flex-wrap gap-2 text-[11px] text-ink-muted">
                <Pill tone="neutral">
                  {active.method_of_sale_name}
                  {active.table_number ? ` \u00b7 table ${active.table_number}` : ""}
                </Pill>
                <Pill tone="neutral">{active.payment_method_name}</Pill>
                <Pill tone={PAYMENT_TONE[active.payment_status]}>
                  {PAYMENT_LABEL[active.payment_status]}
                </Pill>
              </div>

              <OrderItemsTable items={active.items} />

              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-ink-muted">Total</span>
                <span className="text-lg font-extrabold text-ink">{money(active.total)}</span>
              </div>

              {active.notes ? (
                <p className="rounded-[6px] bg-cream-2 px-3 py-2 text-[12px] text-ink-secondary">
                  <span className="font-bold">Note:</span> {active.notes}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Control label="Order status">
                  <select
                    className="login-field !pl-3"
                    value={active.order_status}
                    disabled={busy === active.id}
                    onChange={(e) =>
                      void patch(active, "status", { order_status: e.target.value as OrderStatus })
                    }
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {stepLabel(active, s)}
                      </option>
                    ))}
                  </select>
                </Control>
                <Control label="Payment">
                  <select
                    className="login-field !pl-3"
                    value={active.payment_status}
                    disabled={busy === active.id}
                    onChange={(e) =>
                      void patch(active, "status", {
                        payment_status: e.target.value as PaymentStatus,
                      })
                    }
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {PAYMENT_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </Control>
                {active.method_of_sale === "DELIVERY" ? (
                  <Control label="Rider" className="sm:col-span-2">
                    <select
                      className="login-field !pl-3"
                      value={active.id_delivery_person ?? ""}
                      disabled={busy === active.id}
                      onChange={(e) =>
                        void patch(active, "assign", {
                          id_delivery_person: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    >
                      <option value="">Unassigned</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                          {r.phone ? ` (${r.phone})` : ""}
                        </option>
                      ))}
                    </select>
                    {riders.length === 0 ? (
                      <p className="mt-1 text-[11px] text-ink-muted">
                        No active rider account yet. Riders register with the courier role.
                      </p>
                    ) : null}
                  </Control>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {next ? (
                  <button
                    onClick={() => void patch(active, "status", { order_status: next })}
                    disabled={busy === active.id}
                    className="login-cta inline-flex items-center gap-2"
                  >
                    {busy === active.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Mark as {stepLabel(active, next)}
                  </button>
                ) : null}
                {isActiveOrder(active) ? (
                  <button
                    onClick={() => void patch(active, "status", { order_status: "CANCELED" })}
                    disabled={busy === active.id}
                    className="login-ghost inline-flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" /> Cancel order
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Select an order to see its details.</p>
          )}
        </Panel>
      </div>
    </>
  );
}

function Control({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
