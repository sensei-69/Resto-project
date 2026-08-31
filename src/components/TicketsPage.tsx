import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  TicketCheck,
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
import { LayoutDashboard, ShoppingBag, UtensilsCrossed } from "lucide-react";

const userNav: NavItem[] = [
  { to: "/dashboard", label: "My space", icon: LayoutDashboard, exact: true },
  { to: "/my-orders", label: "My orders", icon: ShoppingBag, exact: true },
  { to: "/tickets", label: "My tickets", icon: TicketCheck, exact: true },
  { to: "/menu", label: "Order food", icon: UtensilsCrossed },
];

type Ticket = {
  id: number;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  created_at: string;
  // admin-only fields
  user_name?: string;
  user_email?: string;
};

const STATUS_TONE: Record<string, "success" | "brand" | "neutral" | "muted"> = {
  OPEN: "brand",
  IN_PROGRESS: "neutral",
  CLOSED: "success",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
};

const ADMIN_ROLES = ["OWNER", "SUPER_ADMIN"];

export default function TicketsPage() {
  const { token, user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ tickets: Ticket[] }>("/api/tickets", { token });
      setTickets(res.tickets);
      if (res.tickets.length > 0 && !selected) {
        setSelected(res.tickets[0]!);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tickets");
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (ticketId: number, status: string) => {
    setUpdating(true);
    try {
      const res = await api<{ ticket: Ticket }>(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: { status },
        token,
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? res.ticket : t)),
      );
      setSelected(res.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const open = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const closed = tickets.filter((t) => t.status === "CLOSED").length;

  const nav = isAdmin
    ? [
        { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
        { to: "/tickets", label: "Tickets", icon: TicketCheck, exact: true },
      ]
    : userNav;

  return (
    <DashboardShell
      role={isAdmin ? (user?.role === "SUPER_ADMIN" ? "Super Admin" : "Owner") : "Customer"}
      person={user?.name ?? ""}
      nav={nav}
    >
      <PageHeader
        eyebrow="Support"
        title={isAdmin ? "Support tickets" : "My tickets"}
        description={
          isAdmin
            ? "All customer support requests — update status to keep users informed."
            : "Your support requests. We'll get back to you as soon as possible."
        }
      />

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={String(open)} icon={MessageSquare} />
        <StatCard label="In progress" value={String(inProgress)} icon={Clock} />
        <StatCard label="Closed" value={String(closed)} icon={CheckCircle2} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Tickets"
          hint={`${tickets.length} total`}
          className="xl:col-span-2"
        >
          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading tickets…
            </p>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center">
              <TicketCheck className="mx-auto h-8 w-8 text-ink-muted" />
              <p className="mt-3 text-sm text-ink-muted">No tickets yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setSelected(t)}
                    className={`w-full rounded-[6px] border p-4 text-left transition-colors hover:bg-cream-2/60 ${
                      selected?.id === t.id
                        ? "border-brand/40 bg-brand/5"
                        : "border-border bg-cream-1"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{t.subject}</p>
                        {isAdmin && t.user_name ? (
                          <p className="text-[11px] text-ink-muted">
                            {t.user_name} · {t.user_email}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Pill tone={STATUS_TONE[t.status] ?? "neutral"}>
                          {STATUS_LABEL[t.status] ?? t.status}
                        </Pill>
                        <span className="text-[10px] text-ink-muted">
                          {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12px] text-ink-secondary">{t.message}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Ticket detail"
          hint={selected ? STATUS_LABEL[selected.status] : ""}
        >
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-extrabold text-ink">{selected.subject}</p>
                {isAdmin && selected.user_name ? (
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    From: {selected.user_name} ({selected.user_email})
                  </p>
                ) : null}
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>

              <div className="rounded-[6px] border border-border bg-cream-2/50 p-3">
                <p className="text-sm leading-relaxed text-ink-secondary">{selected.message}</p>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                  Status
                </p>
                <Pill tone={STATUS_TONE[selected.status] ?? "neutral"}>
                  {STATUS_LABEL[selected.status] ?? selected.status}
                </Pill>
              </div>

              {isAdmin ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                    Update status
                  </p>
                  {(["OPEN", "IN_PROGRESS", "CLOSED"] as const).map((s) => (
                    <button
                      key={s}
                      disabled={selected.status === s || updating}
                      onClick={() => void updateStatus(selected.id, s)}
                      className={`w-full rounded-[4px] border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected.status === s
                          ? "border-brand bg-brand text-cream-1"
                          : "border-border bg-cream-1 text-ink-secondary hover:border-brand hover:text-brand"
                      }`}
                    >
                      {updating && selected.status !== s ? (
                        <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
                      ) : (
                        STATUS_LABEL[s]
                      )}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Select a ticket to read it.</p>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
