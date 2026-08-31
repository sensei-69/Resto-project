import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Beef, Check, PartyPopper } from "lucide-react";
import "./register.css";
import { emptyData, type RegisterData, type Role } from "./types";
import { RoleStep } from "./steps/RoleStep";
import { AccountStep } from "./steps/AccountStep";
import { PaymentStep } from "./steps/PaymentStep";
import { DeliveryStep } from "./steps/DeliveryStep";
import { useAuth } from "../../context/AuthContext";

type StepId = "role" | "account" | "payment" | "delivery" | "done";

const FLOWS: Record<Role, StepId[]> = {
  consumer: ["role", "account", "payment", "done"],
  courier: ["role", "account", "payment", "delivery", "done"],
};

export default function RegisterPage() {
  const { register } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<RegisterData>(emptyData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(() => (role ? FLOWS[role] : ["role", "account", "payment", "done"]), [role]);
  const current = steps[index] ?? "role";
  const visible = steps.filter((s) => s !== "done");

  const set = <K extends keyof RegisterData>(key: K, value: RegisterData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const advance = () => setIndex((i) => Math.min(i + 1, steps.length - 1));

  // Create the real account when leaving the last data step.
  const next = async () => {
    if (steps[index + 1] !== "done") {
      advance();
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await register({
        name: `${data.firstName} ${data.lastName}`.trim() || data.email,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        role: role ?? "consumer",
      });
      advance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed \u2014 please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => setIndex((i) => Math.max(i - 1, 0));

  const stepProps = { data, set, next, back };

  return (
    <main className="rg-root">
      <div className="rg-wash" aria-hidden />
      <div className="rg-orb rg-orb--red" aria-hidden />
      <div className="rg-orb rg-orb--orange" aria-hidden />
      <div className="rg-orb rg-orb--yellow" aria-hidden />

      <div className="rg-shell">
        <header className="rg-head">
          <div className="rg-logo">
            <Beef size={28} strokeWidth={1.8} />
          </div>
          <h1 className="rg-title">
            Join the <span>big bite</span>
          </h1>
          <p className="rg-sub">
            A few quick steps and you're in \u2014 order or deliver, your call.
          </p>
        </header>

        {current !== "done" ? (
          <nav className="rg-stepper" aria-label="Registration progress">
            {visible.map((s, i) => {
              const done = i < index;
              const active = i === index;
              return (
                <div
                  key={s}
                  className={`rg-step${active ? " rg-step--active" : ""}${done ? " rg-step--done" : ""}`}
                >
                  <span className="rg-step-dot">
                    {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  {i < visible.length - 1 ? (
                    <span className="rg-step-bar">
                      <span />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </nav>
        ) : null}

        {error ? (
          <p
            role="alert"
            style={{
              color: "#c0392b",
              textAlign: "center",
              margin: "0.75rem 0 0",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            {error}
          </p>
        ) : null}
        {submitting ? (
          <p style={{ textAlign: "center", margin: "0.75rem 0 0", fontSize: "0.9rem" }}>
            Creating your account\u2026
          </p>
        ) : null}

        {current === "role" ? (
          <RoleStep
            role={role}
            onPick={(r) => {
              setRole(r);
              setIndex(0);
            }}
            next={next}
          />
        ) : null}
        {current === "account" ? <AccountStep {...stepProps} /> : null}
        {current === "payment" ? <PaymentStep {...stepProps} /> : null}
        {current === "delivery" ? <DeliveryStep {...stepProps} /> : null}
        {current === "done" ? (
          <div className="rg-card">
            <div className="rg-done">
              <div className="rg-done-icon">
                <PartyPopper size={30} strokeWidth={1.9} />
              </div>
              <h2 className="rg-card-title">You're in</h2>
              <p className="rg-card-sub">
                {data.firstName ? `${data.firstName}, ` : ""}your{" "}
                {role === "courier" ? "rider" : "food lover"}{" "}
                account is ready. Sign in to start.
              </p>
              <div className="rg-actions" style={{ marginTop: "1.5rem" }}>
                <Link to="/login" className="rg-btn rg-btn--primary">
                  Go to sign in
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <p className="rg-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
