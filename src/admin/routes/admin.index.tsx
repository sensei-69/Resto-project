import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Banknote, Loader2, ShoppingBag, Star, TrendingUp } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "../components/dashboard/shell";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { type RangeKey } from "../lib/dashboard-data";

const ranges: { key: RangeKey; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

type SeriesPoint = { label: string; orders: number; revenue: number };
type TopFood = { name: string; orders: number; revenue: number; share: number };
type Feedback = { name: string; rating: number; text: string; time: string };
type Totals = { orders: number; revenue: number; profit: number; avgBasket: number };

type AnalyticsResponse = {
  series: SeriesPoint[];
  topFoods: TopFood[];
  feedback: Feedback[];
  totals: Totals;
};

export default function AdminOverview() {
  const { token } = useAuth();
  const [range, setRange] = useState<RangeKey>("month");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (r: RangeKey) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api<AnalyticsResponse>(`/api/analytics?range=${r}`, { token });
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load analytics");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load(range);
  }, [load, range]);

  const totals = data?.totals ?? { orders: 0, revenue: 0, profit: 0, avgBasket: 0 };
  const series = data?.series ?? [];
  const topFoods = data?.topFoods ?? [];
  const feedback = data?.feedback ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Owner diagnostic"
        title="Kitchen performance"
        description="Everything happening across the grill: orders, profit, who is eating and what they think about it."
        action={
          <div className="flex items-center gap-1 rounded-[4px] border border-border bg-cream-1 p-1">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-[3px] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] transition-colors ${
                  range === r.key
                    ? "bg-brand text-cream-1"
                    : "text-ink-muted hover:bg-cream-2 hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <div className="mb-4 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Commands" value={loading ? "—" : totals.orders.toLocaleString()} icon={ShoppingBag} />
        <StatCard
          label="Revenue"
          value={loading ? "—" : `$${Math.round(totals.revenue).toLocaleString()}`}
          icon={Banknote}
        />
        <StatCard
          label="Net profit"
          value={loading ? "—" : `$${Math.round(totals.profit).toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Avg. basket"
          value={loading ? "—" : `$${totals.avgBasket.toFixed(2)}`}
          icon={Star}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title={`Revenue per ${range}`} hint="Gross vs. orders" className="xl:col-span-2">
          {loading ? (
            <div className="flex h-[290px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ left: -18, right: 6, top: 8 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--ink-muted)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--cream-1)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--brand)"
                    strokeWidth={2}
                    fill="url(#revFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Most demanded food" hint="By orders">
          {loading ? (
            <div className="flex h-[290px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : topFoods.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">No order data yet.</p>
          ) : (
            <ul className="space-y-3.5">
              {topFoods.map((food, i) => (
                <li key={food.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-ink">
                      <span className="mr-2 text-[11px] font-extrabold text-brand">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {food.name}
                    </span>
                    <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                      {food.orders.toLocaleString()} · ${food.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-cream-3">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${food.share}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Latest feedback" hint={feedback.length ? `${feedback.length} recent` : "No tickets yet"}>
          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : feedback.length === 0 ? (
            <p className="text-sm text-ink-muted">No support tickets yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {feedback.map((f, i) => (
                <article key={i} className="rounded-[6px] border border-border bg-cream-2/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink">{f.name}</p>
                    <Pill tone={f.rating >= 4 ? "success" : "brand"}>{f.rating}.0 ★</Pill>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{f.text}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                    {f.time}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
