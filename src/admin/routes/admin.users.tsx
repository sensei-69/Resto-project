import { useState } from "react";
import { Ban, PencilLine, Search, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "../components/dashboard/shell";
import { appUsers, type AppUser } from "../lib/dashboard-data";
import { Users, Star, TrendingUp, Banknote } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>(appUsers);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>(appUsers[0]!.id);

  const visible = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );
  const active = users.find((u) => u.id === selected) ?? visible[0];

  const toggleBan = (id: string) =>
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "Banned" ? "Active" : "Banned" } : u)),
    );
  const remove = (id: string) => setUsers((prev) => prev.filter((u) => u.id !== id));

  const avgAge = Math.round(users.reduce((a, u) => a + u.age, 0) / (users.length || 1));
  const spend = users.reduce((a, u) => a + u.spent, 0);

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Customer management"
        description="See every account, edit or delete it, ban abusive customers and read their personal analytics."
        action={
          <button className="login-cta !w-auto px-5">
            <span className="inline-flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5" /> Add user
            </span>
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Accounts" value={String(users.length)} delta="+4 this week" icon={Users} />
        <StatCard label="Average age" value={`${avgAge} yrs`} icon={Star} />
        <StatCard label="Lifetime spend" value={`$${spend.toLocaleString()}`} delta="+9.3%" icon={Banknote} />
        <StatCard
          label="Banned"
          value={String(users.filter((u) => u.status === "Banned").length)}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="All customers" hint={`${visible.length} shown`}>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="login-field"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                  <th className="py-2.5 pr-3">Customer</th>
                  <th className="py-2.5 pr-3">Age</th>
                  <th className="py-2.5 pr-3">Orders</th>
                  <th className="py-2.5 pr-3">Spent</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u.id)}
                    className={`cursor-pointer border-b border-border/70 text-sm transition-colors hover:bg-cream-2/70 ${
                      active?.id === u.id ? "bg-cream-2" : ""
                    }`}
                  >
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-ink">{u.name}</p>
                      <p className="text-[11px] text-ink-muted">{u.email}</p>
                    </td>
                    <td className="py-3 pr-3 text-ink-secondary">{u.age}</td>
                    <td className="py-3 pr-3 text-ink-secondary">{u.orders}</td>
                    <td className="py-3 pr-3 font-semibold text-ink">${u.spent}</td>
                    <td className="py-3 pr-3">
                      <Pill tone={u.status === "Active" ? "success" : "brand"}>{u.status}</Pill>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton label={`Edit ${u.name}`} icon={PencilLine} onClick={() => setSelected(u.id)} />
                        <IconButton
                          label={u.status === "Banned" ? `Unban ${u.name}` : `Ban ${u.name}`}
                          icon={u.status === "Banned" ? ShieldCheck : Ban}
                          onClick={() => toggleBan(u.id)}
                        />
                        <IconButton label={`Delete ${u.name}`} icon={Trash2} onClick={() => remove(u.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Customer analytics" hint={active ? active.joined : ""}>
          {active ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-extrabold text-ink">{active.name}</p>
                <p className="text-[11px] text-ink-muted">{active.email}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <Fact label="Age" value={`${active.age}`} />
                <Fact label="Gender" value={active.gender} />
                <Fact label="Orders" value={String(active.orders)} />
                <Fact label="Spent" value={`$${active.spent}`} />
                <Fact label="Avg. basket" value={`$${(active.spent / active.orders).toFixed(2)}`} />
                <Fact label="Status" value={active.status} />
              </dl>
              <div className="rounded-[6px] border border-border bg-cream-2/60 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                  Favourite dish
                </p>
                <p className="mt-1 text-sm font-bold text-ink">{active.favourite}</p>
              </div>
              <button
                onClick={() => toggleBan(active.id)}
                className={active.status === "Banned" ? "login-ghost" : "login-cta"}
              >
                {active.status === "Banned" ? "Lift the ban" : "Ban this customer"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Select a customer to see their analytics.</p>
          )}
        </Panel>
      </div>
    </>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Ban;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded-[4px] border border-border bg-cream-1 p-1.5 text-ink-muted transition-colors hover:border-brand hover:text-brand"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] border border-border bg-cream-1 p-3">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-ink">{value}</dd>
    </div>
  );
}
