const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  /** Machine-readable code sent by the API (e.g. CARD_REQUIRED, INSUFFICIENT_BALANCE). */
  code: string | null;
  data: unknown;

  constructor(status: number, message: string, code: string | null = null, data: unknown = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
};

const str = (obj: unknown, key: string): string | null =>
  obj && typeof obj === "object" && key in obj && typeof (obj as Record<string, unknown>)[key] === "string"
    ? ((obj as Record<string, string>)[key] ?? null)
    : null;

export async function api<T>(path: string, { method = "GET", body, token }: ApiOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, str(data, "error") ?? `Request failed (${res.status})`, str(data, "code"), data);
  }
  return data as T;
}
