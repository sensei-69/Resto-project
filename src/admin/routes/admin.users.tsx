import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Banknote,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users as UsersIcon,
  UserX,
} from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "../components/dashboard/shell";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type Role = "OWNER" | "SUPER_ADMIN" | "USER" | "DELIVERY";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  balance: string;
  is_active: boolean;
  created_at: string;
  orders_count: number;
  total_spent: string | number;
};

const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  SUPER_ADMIN: "Super Admin",
  USER: "Customer",
  DELIVERY: "Rider",
};

const isProtected = (u: AdminUser) => u.role === "OWNER" || u.role === "SUPER_ADMIN";

export default function AdminUsers() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ users: AdminUser[] }>("/api/users", { token });
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );
  const active = users.find((u) => u.id === selected) ?? visible[0];

  const canTouch = (u: AdminUser) => !isProtected(u) && u.id !== me?.id;

  const toggleBan = async (u: AdminUser) => {
    if (!canTouch(u)) return;
    const before = users;
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !x.is_active } : x)));
    try {
      await api(`/api/users/${u.id}`, { method: "PATCH", body: { is_active: !u.is_active }, token });
    } catch (err) {
      setUsers(before);
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const remove = async (u: AdminUser) => {
    if (!canTouch(u)) return;
    try {
      await api(`/api/users/${u.id}`, { method: "DELETE", token });
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const spend = users.reduce((a, u) => a + Number(u.total_spent), 0);
  const banned = users.filter((u) => !u.is_active).length;

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="User management"
        description="Every account on the platform \u2014 customers and riders \u2014 with their real order history. Ban abusive accounts or remove them."
      />

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Accounts" value={String(users.length)} icon={UsersIcon} />
        <StatCard
          label="Active"
          value={String(users.length - banned)}
          icon={UserCheck}
        />
        <StatCard label="Banned" value={String(banned)} icon={UserX} />
        <StatCard label="Lifetime spend" value={`$${spend.toLocaleString()}`} icon={Banknote} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="All accounts" hint={`${visible.length} shown`}>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="login-field"
            />
          </div>

          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading accounts\u2026
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                    <th className="py-2.5 pr-3">Account</th>
                    <th className="py-2.5 pr-3">Role</th>
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
                      <td className="py-3 pr-3">
                        <Pill tone={isProtected(u) ? "brand" : u.role === "DELIVERY" ? "neutral" : "muted"}>
                          {ROLE_LABEL[u.role]}
                        </Pill>
                      </td>
                      <td className="py-3 pr-3 text-ink-secondary">{u.orders_count}</td>
                      <td className="py-3 pr-3 font-semibold text-ink">
                        ${Number(u.total_spent).toFixed(2)}
                      </td>
                      <td className="py-3 pr-3">
                        <Pill tone={u.is_active ? "success" : "brand"}>
                          {u.is_active ? "Active" : "Banned"}
                        </Pill>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <IconButton
                            label={u.is_active ? `Ban ${u.name}` : `Unban ${u.name}`}
                            icon={u.is_active ? Ban : ShieldCheck}
                            disabled={!canTouch(u)}
                            onClick={() => void toggleBan(u)}
                          />
                          <IconButton
                            label={`Delete ${u.name}`}
                            icon={Trash2}
                            disabled={!canTouch(u)}
                            onClick={() => void remove(u)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visible.length === 0 ? (
                <p className="py-3 text-sm text-ink-muted">No account matches this search.</p>
              ) : null}
            </div>
          )}
        </Panel>

        <Panel
          title="Account details"
          hint={active ? `Joined ${new Date(active.created_at).toLocaleDateString()}` : ""}
        >
          {active ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-extrabold text-ink">{active.name}</p>
                <p className="text-[11px] text-ink-muted">{active.email}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <Fact label="Role" value={ROLE_LABEL[active.role]} />
                <Fact label="Phone" value={active.phone ?? "\u2014"} />
                <Fact label="Balance" value={`$${Number(active.balance).toFixed(2)}`} />
                <Fact label="Orders" value={String(active.orders_count)} />
                <Fact label="Spent" value={`$${Number(active.total_spent).toFixed(2)}`} />
                <Fact label="Status" value={active.is_active ? "Active" : "Banned"} />
              </dl>
              {canTouch(active) ? (
                <button
                  onClick={() => void toggleBan(active)}
                  className={active.is_active ? "login-cta" : "login-ghost"}
                >
                  {active.is_active ? "Ban this account" : "Lift the ban"}
                </button>
              ) : (
                <p className="text-[11px] text-ink-muted">
                  Owner and Super Admin accounts can't be banned or deleted here.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Select an account to see its details.</p>
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
  disabled = false,
}: {
  icon: typeof Ban;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded-[4px] border border-border bg-cream-1 p-1.5 text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
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
