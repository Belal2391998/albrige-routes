const SESSION_TOKEN_KEY = "albridge_admin_session_token";

export function getAdminSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminSessionToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearAdminSessionToken() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
