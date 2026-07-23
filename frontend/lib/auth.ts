import { API_URL } from "./types";
import type { AuthTokens, User } from "./types";
import { getSessionId } from "./session";

const ACCESS_KEY = "beefshteks_access_token";
const REFRESH_KEY = "beefshteks_refresh_token";
const USER_KEY = "beefshteks_user";

function baseHeaders(): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("X-Session-Id", getSessionId());
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = baseHeaders();
  if (init?.headers) {
    new Headers(init.headers).forEach((v, k) => headers.set(k, v));
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail[0]?.msg || res.statusText
          : res.statusText;
    throw new Error(message);
  }
  return res.json();
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setAuth(tokens: AuthTokens, user: User): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("auth-changed"));
}

export function clearAuth(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth-changed"));
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getStoredUser();
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "X-Session-Id": getSessionId() };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function mockTokens(phone: string): AuthTokens {
  const id = phone.replace(/\D/g, "").slice(-8) || "guest";
  return {
    access_token: `mock-access-${id}`,
    refresh_token: `mock-refresh-${id}`,
    token_type: "bearer",
  };
}

function mockUser(phone: string): User {
  const id = phone.replace(/\D/g, "").slice(-8) || "guest";
  return { id: `user-${id}`, phone };
}

export async function sendOtp(phone: string): Promise<{ success: boolean; message?: string }> {
  try {
    return await authFetch("/api/v1/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  } catch {
    return { success: true, message: "Код отправлен (демо)" };
  }
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ tokens: AuthTokens; user: User }> {
  try {
    const res = await authFetch<{ access_token: string; refresh_token: string; user: User }>(
      "/api/v1/auth/otp/verify",
      { method: "POST", body: JSON.stringify({ phone, code }) }
    );
    const tokens: AuthTokens = {
      access_token: res.access_token,
      refresh_token: res.refresh_token,
    };
    setAuth(tokens, res.user);
    return { tokens, user: res.user };
  } catch {
    if (code.length !== 4) throw new Error("Введите 4-значный код");
    const tokens = mockTokens(phone);
    const user = mockUser(phone);
    setAuth(tokens, user);
    return { tokens, user };
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await authFetch<{ access_token: string; refresh_token?: string }>(
      "/api/v1/auth/refresh",
      { method: "POST", body: JSON.stringify({ refresh_token: refresh }) }
    );
    const user = getStoredUser();
    if (!user) return false;
    setAuth(
      {
        access_token: res.access_token,
        refresh_token: res.refresh_token || refresh,
      },
      user
    );
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

export async function fetchMe(): Promise<User | null> {
  if (!getAccessToken()) return null;
  try {
    const user = await authFetch<User>("/api/v1/users/me");
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("auth-changed"));
    return user;
  } catch {
    return getStoredUser();
  }
}

export function logout(): void {
  clearAuth();
}
