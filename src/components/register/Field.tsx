import { useState, type ComponentType, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export function Field({
  label,
  icon: Icon,
  children,
  optional,
}: {
  label: string;
  icon?: IconType | undefined;
  children: ReactNode;
  optional?: boolean | undefined;
}) {
  return (
    <label className="rg-label">
      <span className="rg-label-text">
        {label}
        {optional ? <span className="rg-optional">optional</span> : null}
      </span>
      <div className="rg-field">
        {Icon ? <Icon className="rg-field-icon" size={18} strokeWidth={1.9} /> : null}
        {children}
      </div>
    </label>
  );
}

export function TextField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  optional,
  autoComplete,
  inputMode,
}: {
  label: string;
  icon?: IconType | undefined;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  type?: string;
  optional?: boolean | undefined;
  autoComplete?: string | undefined;
  inputMode?: "text" | "tel" | "email" | "numeric" | undefined;
}) {
  return (
    <Field label={label} icon={icon} optional={optional}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={!optional}
      />
    </Field>
  );
}

export function PasswordField({
  label,
  icon,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "new-password",
}: {
  label: string;
  icon?: IconType | undefined;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <Field label={label} icon={icon}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="rg-eye"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} strokeWidth={1.9} /> : <Eye size={18} strokeWidth={1.9} />}
      </button>
    </Field>
  );
}
