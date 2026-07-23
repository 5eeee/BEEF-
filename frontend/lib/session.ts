const SESSION_KEY = "beefshteks_session_id";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `sess-${crypto.randomUUID()}`;
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr-placeholder-session";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
