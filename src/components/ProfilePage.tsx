import { useState } from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, User } from "lucide-react";
import { DashboardShell, PageHeader, Panel } from "../admin/components/dashboard/shell";
import { api } from "../lib/api";
import { useAuth, type AuthUser } from "../context/AuthContext";
import { USER_NAV } from "./user-nav";

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "FR", label: "Français" },
  { code: "AR", label: "العربية" },
];

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [language, setLanguage] = useState(user?.preferred_language ?? "EN");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (saving || !name.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api<{ user: AuthUser }>("/api/users/me", {
        method: "PATCH",
        body: {
          name: name.trim(),
          phone: phone.trim() || null,
          preferred_language: language,
          avatar_url: avatar,
        },
        token,
      });
      updateUser(res.user);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your infos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell role="Customer" person={user?.name ?? ""} nav={USER_NAV}>
      <PageHeader
        eyebrow="My account"
        title="My infos"
        description="Review and update your personal information."
      />

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <Panel title="Personal information" hint="Only you can see this">
        <div className="flex flex-wrap gap-6">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-border bg-cream-2">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="absolute inset-0 m-auto h-10 w-10 text-ink-muted" />
            )}
            <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-full bg-brown/60 text-[9px] font-extrabold uppercase tracking-[0.14em] text-cream-1 opacity-0 transition-opacity hover:opacity-100">
              <ImagePlus className="h-4 w-4" />
              Change
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="grid min-w-[260px] max-w-xl flex-1 gap-3">
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Full name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="login-field mt-1 !pl-3"
                aria-label="Full name"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Email (cannot be changed)
              </span>
              <input
                value={user?.email ?? ""}
                disabled
                className="login-field mt-1 !pl-3 opacity-60"
                aria-label="Email"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Phone
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                className="login-field mt-1 !pl-3"
                aria-label="Phone"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Preferred language
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="login-field mt-1 !pl-3"
                aria-label="Preferred language"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !name.trim()}
                className="inline-flex items-center gap-2 rounded-[4px] bg-brand px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cream-1 hover:brightness-95 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save changes
              </button>
              {saved ? (
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-success">
                  Saved
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Panel>
    </DashboardShell>
  );
}
