import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  PackageCheck,
  Truck,
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

const nav: NavItem[] = [
  { to: "/delivery", label: "My drops", icon: Truck, exact: true },
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
  total: string | number;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
};

const DROP_STATUS_TONE: Record<string, "success" | "brand" | "neutral" | "muted"> = {
  COMPLETED: "success",
  CANCELED: "brand",
  READY: "neutral",
  PREPARING: "muted",
  CONFIRMED: "muted",
  NEW: "muted",
};

const DROP_STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready for pickup",
  COMPLETED: "Delivered",
  CANCELED: "Cancelled",
};

// Placeholder weekly chart — real earnings per day would need a dedicated
// endpoint; this derives a rough estimate from completed orders this week.
function buildWeekSeries(orders: Order[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const counts: Record<string, { deliveries: number; earnings: number }> = {};
  days.forEach((d) => (counts[d] = { deliveries: 0, earnings: 0 }));
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  for (const o of orders) {
    if (o.order_status !== "COMPLETED") continue;
    const d = new Date(o.created_at);
    if (d < weekAgo) continue;
    const label = days[d.getDay()]!;
    counts[label].deliveries += 1;
    counts[label].earnings += Number(o.total) * 0.12; // 12% rider cut estimate
  }
  return days.map((label) => ({ label, ...counts[label] }));
}

export default function DeliveryDashboard() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ orders: Order[] }>("/api/orders/assigned", { token });
      setOrders(res.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load drops");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = orders.filter((o) =>
    ["NEW", "CONFIRMED", "PREPARING", "READY"].includes(o.order_status),
  );
  const completed = orders.filter((o) => o.order_status === "COMPLETED");
  const weekEarnings = completed
    .filter((o) => {
      const d = new Date(o.created_at);
      return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    })
    .reduce((s, o) => s + Number(o.total) * 0.12, 0);

  const weekSeries = buildWeekSeries(orders);

  return (
    <DashboardShell role="Delivery" person={user?.name ?? ""} nav={nav}>
      <PageHeader
        eyebrow="Rider console"
        title="My drops"
        description="Your assigned deliveries and weekly performance at a glance."
      />

      {error ? (
        <div className="mb-4 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active drops" value={loading ? "—" : String(active.length)} icon={Truck} />
        <StatCard
          label="Delivered (all time)"
          value={loading ? "—" : String(completed.length)}
          icon={PackageCheck}
        />
        <StatCard
          label="Est. earnings (7d)"
          value={loading ? "—" : `$${weekEarnings.toFixed(2)}`}
          icon={Banknote}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Assigned drops" hint={`${active.length} active`}>
          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : active.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <p className="mt-3 text-sm text-ink-muted">No active drops right now. Check back soon!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {active.map((order) => (
                <li
                  key={order.id}
                  className="rounded-[6px] border border-border bg-cream-2/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[11px] font-bold text-ink-muted">
                        #{order.order_number}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                      </p>
                      {order.notes ? (
                        <p className="mt-1 text-[11px] text-ink-muted">Note: {order.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Pill tone={DROP_STATUS_TONE[order.order_status] ?? "neutral"}>
                        {DROP_STATUS_LABEL[order.order_status] ?? order.order_status}
                      </Pill>
                      <span className="text-sm font-bold text-ink">
                        ${Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> See map
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Weekly performance" hint="Est. earnings from completed drops">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekSeries} margin={{ left: -20, right: 6 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--cream-3)" }}
                  contentStyle={{
                    background: "var(--cream-1)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="earnings" fill="var(--brand)" radius={[3, 3, 0, 0]} name="Est. earnings ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">
            Earnings estimated at 12% of order value. Actual payout may vary.
          </p>
        </Panel>
      </div>
    </DashboardShell>
  );
}
