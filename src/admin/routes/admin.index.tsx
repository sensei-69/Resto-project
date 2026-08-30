import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Banknote, ShoppingBag, Star, TrendingUp, UserPlus, Users } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "../components/dashboard/shell";
import {
  ageBuckets,
  feedbacks,
  genderSplit,
  rangeSeries,
  topFoods,
  type RangeKey,
} from "../lib/dashboard-data";

const ranges: { key: RangeKey; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const pieColors = ["var(--brand)", "var(--brown)", "var(--ink-muted)"];

export default function AdminOverview() {
  const [range, setRange] = useState<RangeKey>("month");
  const series = rangeSeries[range];

  const totals = useMemo(() => {
    const orders = series.reduce((a, b) => a + b.orders, 0);
    const revenue = series.reduce((a, b) => a + b.revenue, 0);
    return { orders, revenue, profit: revenue * 0.31 };
  }, [series]);

  const totalUsers = ageBuckets.reduce((a, b) => a + b.users, 0);
  const averageAge = Math.round(
    ageBuckets.reduce((a, b) => a + b.users * (parseInt(b.label, 10) + 5), 0) / totalUsers,
  );
  const topAge = [...ageBuckets].sort((a, b) => b.orders - a.orders)[0]!;
  const topGender = [...genderSplit].sort((a, b) => b.value - a.value)[0]!;

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Commands" value={totals.orders.toLocaleString()} delta="+12.4%" icon={ShoppingBag} />
        <StatCard
          label="Revenue"
          value={`$${Math.round(totals.revenue).toLocaleString()}`}
          delta="+8.9%"
          icon={Banknote}
        />
        <StatCard
          label="Net profit"
          value={`$${Math.round(totals.profit).toLocaleString()}`}
          delta="+5.2%"
          icon={TrendingUp}
        />
        <StatCard label="Avg. basket" value={`$${(totals.revenue / totals.orders).toFixed(2)}`} delta="-1.1%" icon={Star} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title={`Revenue per ${range}`} hint="Gross vs. orders" className="xl:col-span-2">
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
        </Panel>

        <Panel title="Customer base" hint={`${totalUsers.toLocaleString()} accounts`}>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={Users} label="Total users" value={totalUsers.toLocaleString()} />
            <MiniStat icon={UserPlus} label="New (30d)" value="412" />
            <MiniStat icon={Star} label="Average age" value={`${averageAge} yrs`} />
            <MiniStat icon={TrendingUp} label="Retention" value="68%" />
          </div>
          <div className="mt-4 h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderSplit}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={3}
                  stroke="none"
                >
                  {genderSplit.map((entry, i) => (
                    <Cell key={entry.label} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--cream-1)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[11px] text-ink-muted">
            Highest demand gender:{" "}
            <span className="font-bold text-ink">
              {topGender.label} ({topGender.value}%)
            </span>
          </p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Demand by age" hint={`Top bracket: ${topAge.label}`}>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageBuckets} margin={{ left: -20, right: 6 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--ink-muted)", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "var(--cream-3)" }}
                  contentStyle={{
                    background: "var(--cream-1)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="orders" fill="var(--brand)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Most demanded food" hint="By orders" className="xl:col-span-2">
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
                    {food.orders.toLocaleString()} orders · ${food.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-cream-3">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${food.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Latest feedback" hint="4.6 / 5 average">
          <div className="grid gap-3 md:grid-cols-2">
            {feedbacks.map((f) => (
              <article key={f.name} className="rounded-[6px] border border-border bg-cream-2/60 p-4">
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
        </Panel>
      </div>
    </>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[6px] border border-border bg-cream-2/60 p-3">
      <Icon className="h-4 w-4 text-brand" />
      <p className="mt-2 text-lg font-extrabold text-ink">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
    </div>
  );
}
