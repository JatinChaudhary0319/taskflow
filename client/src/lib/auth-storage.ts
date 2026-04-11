const AUTH_KEY = "taskflow_auth";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthPayload = {
  token: string;
  user: StoredUser;
};

export function readAuth(): AuthPayload | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AuthPayload;
    if (!data?.token || !data?.user?.id) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeAuth(payload: AuthPayload) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}
