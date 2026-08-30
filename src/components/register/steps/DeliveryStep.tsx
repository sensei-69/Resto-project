import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bike,
  Car,
  Clock,
  Footprints,
  Sparkles,
  Zap,
} from "lucide-react";
import { Field } from "../Field";
import type { StepProps, VehicleType } from "../types";

const VEHICLES: { id: VehicleType; label: string; icon: typeof Bike }[] = [
  { id: "bike", label: "Bicycle", icon: Bike },
  { id: "scooter", label: "Scooter", icon: Zap },
  { id: "car", label: "Car", icon: Car },
  { id: "walk", label: "On foot", icon: Footprints },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DeliveryStep({ data, set, next, back }: StepProps) {
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    set("days", data.days.includes(day) ? data.days.filter((d) => d !== day) : [...data.days, day]);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!data.vehicleType) {
      setError("Choose how you'll be delivering.");
      return;
    }
    if (data.days.length === 0) {
      setError("Select at least one available day.");
      return;
    }
    setError(null);
    next();
  };

  return (
    <form className="rg-card" onSubmit={submit}>
      <div className="rg-card-head">
        <h2 className="rg-card-title">Ride & hours</h2>
        <p className="rg-card-sub">How you deliver and when you're free to take drops.</p>
      </div>

      <div className="rg-form">
        <div>
          <span className="rg-label-text">Vehicle type</span>
          <div className="rg-tiles">
            {VEHICLES.map((v) => {
              const Icon = v.icon;
              const on = data.vehicleType === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  className={on ? "rg-tile rg-tile--on" : "rg-tile"}
                  onClick={() => set("vehicleType", v.id)}
                  aria-pressed={on}
                >
                  <Icon size={24} strokeWidth={1.8} />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rg-grid rg-grid--2">
          <Field label="Available from" icon={Clock}>
            <input
              type="time"
              value={data.fromHour}
              onChange={(e) => set("fromHour", e.target.value)}
              required
            />
          </Field>
          <Field label="Available until" icon={Clock}>
            <input
              type="time"
              value={data.toHour}
              onChange={(e) => set("toHour", e.target.value)}
              required
            />
          </Field>
        </div>

        <div>
          <span className="rg-label-text">Available days</span>
          <div className="rg-days">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                className={data.days.includes(d) ? "rg-day rg-day--on" : "rg-day"}
                onClick={() => toggleDay(d)}
                aria-pressed={data.days.includes(d)}
              >
                {d}
              </button>
            ))}
          </div>
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
            Create account
            <Sparkles className="rg-arrow" size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </form>
  );
}
