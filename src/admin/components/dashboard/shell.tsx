import { Link, NavLink, useNavigate } from "react-router-dom";
import { Flame, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../../../context/AuthContext";

export type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };

export function DashboardShell({
  role,
  person,
  nav,
  children,
}: {
  role: string;
  person: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-cream-2 text-ink">
      <div className="flex w-full flex-col lg:flex-row">
        <aside className="lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 bg-brown-dark px-4 py-5">
          <Link to="/" className="flex items-center gap-2">
            <span
              className="flex h-9 w-10 items-center justify-center bg-brand"
              style={{ clipPath: "polygon(0 0, 100% 0, 84% 100%, 0 100%)" }}
            >
              <Flame className="h-4 w-4 text-cream-1" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-cream-1">
              Ember &amp; Bun
            </span>
          </Link>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-cream-1/45">
            {role} console
          </p>

          <nav className="mt-3 flex flex-row gap-1 overflow-x-auto lg:flex-col">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact ?? false}
                className={({ isActive }) =>
                  `group flex shrink-0 items-center gap-2.5 rounded-[4px] px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-cream-1/10 hover:text-cream-1 ${
                    isActive
                      ? "bg-brand text-cream-1"
                      : "text-cream-1/60"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-[6px] border border-cream-1/12 bg-cream-1/5 p-3 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cream-1/45">
              Signed in
            </p>
            <p className="mt-1 text-sm font-semibold text-cream-1">{person}</p>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-brand-light hover:text-cream-1"
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="login-fade mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        <span className="login-tag">{eyebrow}</span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function Panel({
  title,
  hint,
  children,
  className = "",
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[8px] border border-border bg-cream-1 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
    >
      {title ? (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-ink-secondary">
            {title}
          </h2>
          {hint ? <span className="text-[11px] text-ink-muted">{hint}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
}) {
  const positive = delta?.startsWith("+");
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-border bg-cream-1 p-4">
      <span className="absolute left-0 top-0 h-full w-[3px] bg-brand" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-muted">
          {label}
        </p>
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      {delta ? (
        <p
          className={`mt-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
            positive ? "text-success" : "text-brand"
          }`}
        >
          {delta}
        </p>
      ) : null}
    </div>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "brand" | "success" | "neutral" | "muted"; children: ReactNode }) {
  const tones = {
    brand: "bg-brand/10 text-brand",
    success: "bg-success/12 text-success",
    neutral: "bg-cream-3 text-ink-secondary",
    muted: "bg-ink/8 text-ink-muted",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
