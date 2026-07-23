const ADMIN_TOKEN_KEY = "beefshteks_admin_token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || readCookie("admin_token");
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  document.cookie = `admin_session=1; path=/; SameSite=Lax; max-age=${60 * 60 * 12}`;
  document.cookie = `admin_token=${encodeURIComponent(token)}; path=/; SameSite=Lax; max-age=${60 * 60 * 12}`;
  window.dispatchEvent(new Event("admin-auth-changed"));
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  document.cookie = "admin_session=; path=/; max-age=0";
  document.cookie = "admin_token=; path=/; max-age=0";
  window.dispatchEvent(new Event("admin-auth-changed"));
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}

export function getAdminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { "X-Admin-Token": token } : {};
}
