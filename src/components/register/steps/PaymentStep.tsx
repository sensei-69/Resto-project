import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CreditCard, KeyRound, User, Wifi } from "lucide-react";
import { TextField } from "../Field";
import type { StepProps } from "../types";

function group(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function PaymentStep({ data, set, next, back }: StepProps) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    next();
  };

  const masked = (data.cardNumber || "•••• •••• •••• ••••").padEnd(19, "•");

  return (
    <form className="rg-card" onSubmit={submit}>
      <div className="rg-card-head">
        <h2 className="rg-card-title">
          Payment
          <span className="rg-optional">optional</span>
        </h2>
        <p className="rg-card-sub">Save a card now for one-tap checkout, or skip it for later.</p>
      </div>

      <div className="rg-form">
        <div className="rg-cc" aria-hidden>
          <div className="rg-cc-top">
            <span className="rg-cc-chip" />
            <Wifi size={20} strokeWidth={2.2} style={{ transform: "rotate(90deg)" }} />
          </div>
          <div className="rg-cc-num">{masked}</div>
          <div className="rg-cc-row">
            <span>{data.cardName || "Card holder"}</span>
            <span>{data.cardExpiry || "MM/YY"}</span>
          </div>
        </div>

        <TextField
          label="Card holder"
          icon={User}
          optional
          value={data.cardName}
          onChange={(v) => set("cardName", v)}
          placeholder="AMINE LARACH"
        />

        <TextField
          label="Card number"
          icon={CreditCard}
          optional
          inputMode="numeric"
          value={data.cardNumber}
          onChange={(v) => set("cardNumber", group(v))}
          placeholder="4242 4242 4242 4242"
        />

        <div className="rg-grid rg-grid--2">
          <TextField
            label="Expiry"
            icon={CalendarDays}
            optional
            value={data.cardExpiry}
            onChange={(v) => set("cardExpiry", v)}
            placeholder="MM/YY"
          />
          <TextField
            label="CVC"
            icon={KeyRound}
            optional
            inputMode="numeric"
            value={data.cardCvc}
            onChange={(v) => set("cardCvc", v.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
          />
        </div>

        <div className="rg-actions">
          <button type="button" className="rg-btn rg-btn--ghost" onClick={back}>
            <ArrowLeft size={16} strokeWidth={2.4} />
            Back
          </button>
          <button type="submit" className="rg-btn rg-btn--primary">
            Continue
            <ArrowRight className="rg-arrow" size={16} strokeWidth={2.4} />
          </button>
        </div>
        <button type="button" className="rg-btn rg-btn--skip" onClick={next}>
          Skip for now
        </button>
      </div>
    </form>
  );
}
