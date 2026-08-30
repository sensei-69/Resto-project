import { useMemo, useState } from "react";
import {
  Gift,
  LayoutDashboard,
  MessageSquare,
  PackageCheck,
  Trophy,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import {
  DashboardShell,
  PageHeader,
  Panel,
  Pill,
  StatCard,
  type NavItem,
} from "../../admin/components/dashboard/shell";
import { COUPON_TIERS, USER_NAME, userFeedbacks, userOrders } from "./data";

const nav: NavItem[] = [
  { to: "/dashboard", label: "My space", icon: LayoutDashboard, exact: true },
  { to: "/menu", label: "Order food", icon: UtensilsCrossed },
];

export default function UserDashboard() {
  const [revealed, setRevealed] = useState(false);

  const stats = useMemo(() => {
    const delivered = userOrders.filter((o) => o.status === "Delivered");
    const totalSpent = delivered.reduce((s, o) => s + o.total, 0);

    const dishCounts = new Map<string, number>();
    for (const order of delivered) {
      for (const item of order.items) {
        dishCounts.set(item.name, (dishCounts.get(item.name) ?? 0) + item.qty);
      }
    }
    const topDishes = [...dishCounts.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    // Surprise coupon: earned automatically once the customer has spent enough.
    const coupon = COUPON_TIERS.find((t) => totalSpent >= t.min) ?? null;

    return { totalSpent, deliveredCount: delivered.length, topDishes, coupon };
  }, []);

  const maxQty = stats.topDishes[0]?.qty ?? 1;
  const entryTier = COUPON_TIERS[COUPON_TIERS.length - 1]!;
  const progressToReward = Math.min(100, Math.round((stats.totalSpent / entryTier.min) * 100));

  return (
    <DashboardShell role="Customer" person={USER_NAME} nav={nav}>
      <PageHeader
        eyebrow="My account"
        title={`Welcome back, ${USER_NAME.split(" ")[0]}`}
        description="Your orders, your rewards and the dishes you keep coming back for."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total spent" value={`$${stats.totalSpent.toFixed(2)}`} icon={Wallet} />
        <StatCard
          label="Succeeded orders"
          value={String(stats.deliveredCount)}
          icon={PackageCheck}
        />
        <StatCard
          label="Loyalty status"
          value={stats.coupon ? stats.coupon.label : "Getting started"}
          icon={Trophy}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Your reward" hint="Thanks for being a regular">
          {stats.coupon ? (
            revealed ? (
              <div className="py-4 text-center">
                <Gift className="mx-auto h-8 w-8 text-brand" />
                <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-muted">
                  {stats.coupon.discount}% off your next order
                </p>
                <p className="mt-2 rounded-[6px] border border-dashed border-brand bg-brand/5 px-4 py-3 text-2xl font-extrabold tracking-[0.18em] text-brand">
                  {stats.coupon.code}
                </p>
                <p className="mt-2 text-[11px] text-ink-muted">
                  Earned by spending ${stats.totalSpent.toFixed(0)} with us. Apply it at checkout.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="flex w-full flex-col items-center gap-2 rounded-[6px] border border-dashed border-brand/50 bg-brand/5 px-4 py-8 text-center transition-colors hover:bg-brand/10"
              >
                <span className="text-4xl" aria-hidden>
                  🎁
                </span>
                <span className="text-lg font-extrabold tracking-tight text-ink">
                  It&apos;s a surprise!
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                  You&apos;ve ordered a lot from us — tap to reveal your reward
                </span>
              </button>
            )
          ) : (
            <div className="py-2">
              <p className="text-sm text-ink-secondary">
                Spend <span className="font-bold text-ink">${entryTier.min}</span> in total to unlock
                your first surprise coupon.
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-cream-3">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${progressToReward}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                ${stats.totalSpent.toFixed(0)} / ${entryTier.min} · {progressToReward}% there
              </p>
            </div>
          )}
        </Panel>

        <Panel title="Your top 3 dishes" hint="Most bought" className="xl:col-span-2">
          <ul className="space-y-3.5">
            {stats.topDishes.map((dish, i) => (
              <li key={dish.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold text-ink">
                    <span className="mr-2 text-[11px] font-extrabold text-brand">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {dish.name}
                  </span>
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                    {dish.qty}x ordered
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-cream-3">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.round((dish.qty / maxQty) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Your feedbacks" hint={`${userFeedbacks.length} reviews`}>
          <div className="grid gap-3 md:grid-cols-2">
            {userFeedbacks.map((f) => (
              <article key={f.dish} className="rounded-[6px] border border-border bg-cream-2/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    <MessageSquare className="h-3.5 w-3.5 text-brand" />
                    {f.dish}
                  </p>
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
    </DashboardShell>
  );
}
