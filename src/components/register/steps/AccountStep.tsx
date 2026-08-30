import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, AlertCircle, Lock, Mail, MapPin, Phone, ShieldCheck, User } from "lucide-react";
import { PasswordField, TextField } from "../Field";
import type { StepProps } from "../types";

export function AccountStep({ data, set, next, back }: StepProps) {
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (data.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }
    setError(null);
    next();
  };

  return (
    <form className="rg-card" onSubmit={submit}>
      <div className="rg-card-head">
        <h2 className="rg-card-title">Your details</h2>
        <p className="rg-card-sub">The basics we need to set up your account.</p>
      </div>

      <div className="rg-form">
        <div className="rg-grid rg-grid--2">
          <TextField
            label="First name"
            icon={User}
            value={data.firstName}
            onChange={(v) => set("firstName", v)}
            placeholder="Amine"
            autoComplete="given-name"
          />
          <TextField
            label="Last name"
            icon={User}
            value={data.lastName}
            onChange={(v) => set("lastName", v)}
            placeholder="Larach"
            autoComplete="family-name"
          />
        </div>

        <div className="rg-grid rg-grid--2">
          <TextField
            label="Phone"
            icon={Phone}
            type="tel"
            inputMode="tel"
            value={data.phone}
            onChange={(v) => set("phone", v)}
            placeholder="+212 6 00 00 00 00"
            autoComplete="tel"
          />
          <TextField
            label="Email"
            icon={Mail}
            type="email"
            inputMode="email"
            value={data.email}
            onChange={(v) => set("email", v)}
            placeholder="you@bigbite.com"
            autoComplete="email"
          />
        </div>

        <TextField
          label="Address"
          icon={MapPin}
          value={data.address}
          onChange={(v) => set("address", v)}
          placeholder="12 Grill Street, Casablanca"
          autoComplete="street-address"
        />

        <div className="rg-grid rg-grid--2">
          <PasswordField
            label="Password"
            icon={Lock}
            value={data.password}
            onChange={(v) => set("password", v)}
          />
          <PasswordField
            label="Confirm password"
            icon={ShieldCheck}
            value={data.confirmPassword}
            onChange={(v) => set("confirmPassword", v)}
          />
        </div>

        {error ? (
          <p className="rg-error">
            <AlertCircle size={16} strokeWidth={2.2} />
            {error}
          </p>
        ) : null}

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
      </div>
    </form>
  );
}
