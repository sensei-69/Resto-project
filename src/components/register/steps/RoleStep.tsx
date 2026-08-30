import { ArrowRight, Bike, Check, UtensilsCrossed } from "lucide-react";
import type { Role } from "../types";

const ROLES: {
  id: Role;
  name: string;
  desc: string;
  icon: typeof Bike;
  tone: "red" | "orange" | "green";
}[] = [
  {
    id: "consumer",
    name: "Food lover",
    desc: "Order flame-grilled classics and track every delivery live.",
    icon: UtensilsCrossed,
    tone: "red",
  },
  {
    id: "courier",
    name: "Delivery rider",
    desc: "Pick your hours, ride your route and get paid per drop.",
    icon: Bike,
    tone: "green",
  },
];

export function RoleStep({
  role,
  onPick,
  next,
}: {
  role: Role | null;
  onPick: (role: Role) => void;
  next: () => void;
}) {
  return (
    <div className="rg-card">
      <div className="rg-card-head">
        <h2 className="rg-card-title">Who's joining?</h2>
        <p className="rg-card-sub">Pick the account that fits you. You can only choose one.</p>
      </div>

      <div className="rg-roles">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const on = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              className={on ? "rg-role rg-role--on" : "rg-role"}
              onClick={() => onPick(r.id)}
              aria-pressed={on}
            >
              <span className="rg-role-check">
                <Check size={14} strokeWidth={3} />
              </span>
              <span className={`rg-role-icon rg-role-icon--${r.tone}`}>
                <Icon size={26} strokeWidth={1.8} />
              </span>
              <span className="rg-role-name">{r.name}</span>
              <span className="rg-role-desc">{r.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="rg-actions">
        <button
          type="button"
          className="rg-btn rg-btn--primary"
          onClick={next}
          disabled={!role}
          style={role ? undefined : { opacity: 0.5, cursor: "not-allowed" }}
        >
          Continue
          <ArrowRight className="rg-arrow" size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
