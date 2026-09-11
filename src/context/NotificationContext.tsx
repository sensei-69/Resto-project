import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

export type AppNotification = {
  id: number;
  id_user: number | null;
  audience: "USER" | "ADMIN";
  type: string;
  title: string;
  body: string | null;
  id_order: number | null;
  order_number: string | null;
  order_status: string | null;
  is_read: boolean;
  created_at: string;
};

export type ToastTone = "brand" | "success" | "warning" | "neutral";

export type Toast = {
  id: number;
  title: string;
  body?: string | null;
  tone: ToastTone;
  idOrder?: number | null;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  toasts: Toast[];
  /** Show a transient toast (used for local events such as "order placed"). */
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

const POLL_MS = 10_000;
const TOAST_MS = 6_500;
const MAX_TOASTS = 4;
// The customer already sees the success screen + a local toast for these.
const SILENT_TYPES = new Set(["ORDER_PLACED"]);

const TONE_BY_TYPE: Record<string, ToastTone> = {
  ORDER_NEW: "brand",
  ORDER_CANCELED: "neutral",
  ORDER_STATUS: "success",
  ORDER_PLACED: "success",
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

/** Short two-note chime for the kitchen; silently no-ops when audio is blocked. */
function chime() {
  try {
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    for (const [freq, at] of [
      [880, 0],
      [1174.66, 0.14],
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.18, now + at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.3);
    }
    window.setTimeout(() => void ctx.close(), 700);
  } catch {
    // Audio not available (autoplay policy, no device): nothing to do.
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Ids already shown; null until the first successful load (which is silent).
  const seen = useRef<Set<number> | null>(null);
  const isAdmin = user?.role === "OWNER" || user?.role === "SUPER_ADMIN";

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { ...t, id }]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<{ notifications: AppNotification[]; unread: number }>(
        "/api/notifications",
        { token },
      );
      setNotifications(res.notifications);
      setUnread(res.unread);
      if (seen.current) {
        const fresh = res.notifications.filter(
          (n) => !seen.current!.has(n.id) && !n.is_read && !SILENT_TYPES.has(n.type),
        );
        for (const n of fresh) {
          toast({ title: n.title, body: n.body, tone: TONE_BY_TYPE[n.type] ?? "neutral", idOrder: n.id_order });
        }
        if (isAdmin && fresh.some((n) => n.type === "ORDER_NEW")) chime();
      }
      seen.current = new Set(res.notifications.map((n) => n.id));
    } catch {
      // Keep the last known list; the next poll retries.
    } finally {
      setLoading(false);
    }
  }, [token, toast, isAdmin]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnread(0);
      seen.current = null;
      return;
    }
    setLoading(true);
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [token, refresh]);

  const markRead = useCallback(
    async (id: number) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
      try {
        await api(`/api/notifications/${id}/read`, { method: "PATCH", token });
      } catch {
        // Optimistic update stands; the next poll reconciles.
      }
    },
    [token],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await api("/api/notifications/read-all", { method: "PATCH", token });
    } catch {
      // Same as above.
    }
  }, [token]);

  const value = useMemo(
    () => ({ notifications, unread, loading, refresh, markRead, markAllRead, toasts, toast, dismiss }),
    [notifications, unread, loading, refresh, markRead, markAllRead, toasts, toast, dismiss],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
