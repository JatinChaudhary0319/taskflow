import { clearAuth, readAuth } from "@/lib/auth-storage";

const base = () =>
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

/** Full URL for SSE (EventSource); includes token query because EventSource cannot send Authorization. */
export function taskEventsStreamUrl(projectId: string, token: string): string {
  const q = new URLSearchParams({ token });
  const path = `/projects/${projectId}/stream/tasks?${q.toString()}`;
  const b = base();
  return b ? `${b}${path}` : path;
}

export type ApiErrorBody = {
  error?: string;
  fields?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(message: string, status: number, body: ApiErrorBody = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type Opts = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T>(path: string, opts: Opts = {}): Promise<T> {
  const url = `${base()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(opts.headers);
  if (opts.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!opts.skipAuth) {
    const auth = readAuth();
    if (auth?.token) headers.set("Authorization", `Bearer ${auth.token}`);
  }

  const res = await fetch(url, { ...opts, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: text };
    }
  }

  if (res.status === 401) {
    clearAuth();
  }

  if (!res.ok) {
    const body = (data || {}) as ApiErrorBody;
    const msg = body.error || res.statusText || "Request failed";
    throw new ApiError(msg, res.status, body);
  }

  return data as T;
}
