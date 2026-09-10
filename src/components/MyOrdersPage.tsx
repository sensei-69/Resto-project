import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  DashboardShell,
  PageHeader,
  Panel,
  Pill,
  StatCard,
} from "../admin/components/dashboard/shell";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { USER_NAV } from "./user-nav";
import { OrderItemsTable, OrderProgress } from "./order-ui";
import {
  PAYMENT_LABEL,
  PAYMENT_TONE,
  STATUS_TONE,
  isActiveOrder,
  itemsSummary,
  money,
  statusHint,
  statusLabel,
  type Order,
} from "../lib/orders";

const nav = USER_NAV;
const POLL_MS = 10_000;

const METHOD_ICON = { DINE_IN: UtensilsCrossed, TAKE_AWAY: Store, DELIVERY: Bike } as const;

export default function MyOrdersPage() {
  const { token, user } = useAuth();
  const location = useLocation();
  const placed = (location.state as { placed?: string | null } | null)?.placed ?? null;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await api<{ orders: Order[] }>("/api/orders/mine", { token });
        setOrders(res.orders);
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
  }, [load]);

  // Live tracking: poll while at least one order is still moving.
  const hasActive = orders.some(isActiveOrder);
  useEffect(() => {
    if (!hasActive) return;
    const id = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [hasActive, load]);

  const cancel = async (order: Order) => {
    setBusyId(order.id);
    setError(null);
    try {
      const res = await api<{ order: Order }>(`/api/orders/${order.id}/cancel`, {
        method: "PATCH",
        token,
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel the order");
    } finally {
      setBusyId(null);
    }
  };

  const active = orders.filter(isActiveOrder);
  const history = orders.filter((o) => !isActiveOrder(o));
  const completed = orders.filter((o) => o.order_status === "COMPLETED");
  const totalSpent = completed.reduce((s, o) => s + Number(o.total), 0);

  return (
    <DashboardShell role="Customer" person={user?.name ?? ""} nav={nav}>
      <PageHeader
        eyebrow="Order history"
        title="My orders"
        description="Follow your current orders step by step and browse everything you've ordered before."
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

      {placed ? (
        <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-success/40 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Order <span className="font-mono">#{placed}</span> placed successfully. We&apos;ll update
          this page as the kitchen moves it forward.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="In progress" value={loading ? "\u2014" : String(active.length)} icon={Clock} />
        <StatCard
          label="Completed"
          value={loading ? "\u2014" : String(completed.length)}
          icon={PackageCheck}
        />
        <StatCard label="Total spent" value={loading ? "\u2014" : money(totalSpent)} icon={Wallet} />
      </div>

      {loading ? (
        <div className="mt-4">
          <Panel>
            <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading orders\u2026
            </p>
          </Panel>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-4">
          <Panel>
            <div className="py-8 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-ink-muted" />
              <p className="mt-3 text-sm text-ink-muted">You haven&apos;t placed any orders yet.</p>
              <Link
                to="/menu"
                className="mt-4 inline-block rounded-[4px] bg-brand px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cream-1 hover:bg-brand/90"
              >
                Browse the menu
              </Link>
            </div>
          </Panel>
        </div>
      ) : (
        <>
          {active.length > 0 ? (
            <div className="mt-4">
              <Panel
                title="In progress"
                hint={`${active.length} order${active.length === 1 ? "" : "s"} \u00b7 refreshes automatically`}
              >
                <div className="space-y-3">
                  {active.map((order) => {
                    const Icon = METHOD_ICON[order.method_of_sale] ?? Store;
                    return (
                      <article
                        key={order.id}
                        className="rounded-[8px] border border-border bg-cream-2/40 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-ink-muted">
                                #{order.order_number}
                              </span>
                              <Pill tone={STATUS_TONE[order.order_status]}>{statusLabel(order)}</Pill>
                              <Pill tone={PAYMENT_TONE[order.payment_status]}>
                                {PAYMENT_LABEL[order.payment_status]}
                              </Pill>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-ink">{itemsSummary(order)}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                              <span className="inline-flex items-center gap-1">
                                <Icon className="h-3 w-3" /> {order.method_of_sale_name}
                                {order.table_number ? ` \u00b7 table ${order.table_number}` : ""}
                                {order.delivery_person_name ? ` \u00b7 ${order.delivery_person_name}` : ""}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                            </p>
                          </div>
                          <span className="text-lg font-extrabold text-ink">{money(order.total)}</span>
                        </div>

                        <div className="mt-4">
                          <OrderProgress order={order} />
                        </div>
                        <p className="mt-3 text-[12px] font-medium text-ink-secondary">
                          {statusHint(order)}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                            className="inline-flex items-center gap-1 rounded-[4px] border border-border bg-cream-1 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-secondary hover:border-brand hover:text-brand"
                          >
                            {expanded === order.id ? (
                              <>
                                Hide details <ChevronUp className="h-3.5 w-3.5" />
                              </>
                            ) : (
                              <>
                                Details <ChevronDown className="h-3.5 w-3.5" />
                              </>
                            )}
                          </button>
                          {order.order_status === "NEW" ? (
                            <button
                              onClick={() => void cancel(order)}
                              disabled={busyId === order.id}
                              className="inline-flex items-center gap-1 rounded-[4px] border border-brand/40 bg-brand/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand hover:bg-brand/10 disabled:opacity-50"
                            >
                              {busyId === order.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              Cancel order
                            </button>
                          ) : null}
                        </div>

                        {expanded === order.id ? (
                          <div className="mt-3 rounded-[6px] border border-border bg-cream-1 px-4 py-3">
                            <OrderItemsTable items={order.items} />
                            {order.notes ? (
                              <p className="mt-2 text-[11px] text-ink-muted">Note: {order.notes}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </Panel>
            </div>
          ) : null}

          <div className="mt-4">
            <Panel title="Past orders" hint={`${history.length} order${history.length === 1 ? "" : "s"}`}>
              {history.length === 0 ? (
                <p className="text-sm text-ink-muted">No completed orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((order) => {
                    const isOpen = expanded === order.id;
                    return (
                      <div key={order.id} className="overflow-hidden rounded-[6px] border border-border">
                        <button
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-cream-2/60"
                          onClick={() => setExpanded(isOpen ? null : order.id)}
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-[11px] font-bold text-ink-muted">
                              #{order.order_number}
                            </span>
                            <Pill tone={STATUS_TONE[order.order_status]}>{statusLabel(order)}</Pill>
                            <span className="hidden text-[11px] text-ink-muted sm:inline">
                              {order.method_of_sale_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-ink">{money(order.total)}</span>
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
                            <OrderItemsTable items={order.items} />
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                              <span>{order.method_of_sale_name}</span>
                              <span>
                                {order.payment_method_name} \u00b7 {PAYMENT_LABEL[order.payment_status]}
                              </span>
                              {order.delivery_person_name ? (
                                <span>Rider: {order.delivery_person_name}</span>
                              ) : null}
                              {order.notes ? <span>Note: {order.notes}</span> : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
