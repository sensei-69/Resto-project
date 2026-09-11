import { Bell } from "lucide-react";
import { useState } from "react";

export function NotificationBell({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      aria-label="Notifications"
      onClick={() => setOpen((o) => !o)}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        dark
          ? "text-cream-1/70 hover:bg-cream-1/10 hover:text-cream-1"
          : "text-ink-muted hover:bg-cream-3 hover:text-ink"
      }`}
    >
      <Bell className="h-4 w-4" />
    </button>
  );
}
