import { useState } from "react";
import { X, CreditCard, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import type { AuthUser } from "../context/AuthContext";

interface Props {
  token: string | null;
  onSaved: () => void;
  onClose: () => void;
  updateUser: (user: AuthUser) => void;
}

/** Format a raw card number string into groups of 4 (e.g. "4242 4242 4242 4242"). */
function formatCardNumber(raw: string) {
  return raw
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Format expiry input as MM/YY. */
function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function CardSetupModal({ token, onSaved, onClose, updateUser }: Props) {
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updatedUser = await api<AuthUser>("/api/users/me/card", {
        method: "PUT",
        token,
        body: {
          card_holder: holder.trim(),
          card_number: number.replace(/\s/g, ""),
          card_expiry: expiry,
          card_cvc: cvc,
        },
      });
      updateUser(updatedUser);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="csm-overlay" role="dialog" aria-modal="true" aria-label="Add your card">
      <div className="csm-panel">
        <header className="csm-head">
          <CreditCard />
          <span className="csm-title">Add your card</span>
          <button className="csm-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>

        <form className="csm-form" onSubmit={(e) => void handleSubmit(e)}>
          <label className="csm-label">
            Cardholder name
            <input
              className="csm-input"
              type="text"
              autoComplete="cc-name"
              placeholder="Jane Smith"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              required
            />
          </label>

          <label className="csm-label">
            Card number
            <input
              className="csm-input csm-input--mono"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={number}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              required
            />
          </label>

          <div className="csm-row">
            <label className="csm-label">
              Expiry
              <input
                className="csm-input csm-input--mono"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                required
              />
            </label>

            <label className="csm-label">
              CVC
              <input
                className="csm-input csm-input--mono"
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                required
              />
            </label>
          </div>

          {error ? <p className="csm-error">{error}</p> : null}

          <button className="csm-submit" type="submit" disabled={saving}>
            {saving ? (
              <><Loader2 className="gc-spin" /> Saving\u2026</>
            ) : (
              "Save card"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
