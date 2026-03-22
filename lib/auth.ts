const TOKEN_KEY = "applyai_token";
const USER_KEY = "applyai_user";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const AUTH_COOKIE_NAME = "applyai_auth";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setAuthCookieMarker() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Returns true if the cookie was missing and is now set (caller may want to refresh). */
export function syncAuthCookieFromStorage(): boolean {
  if (typeof document === "undefined") return false;
  if (!localStorage.getItem(TOKEN_KEY)) return false;
  const raw = document.cookie.split(";").map((c) => c.trim());
  for (const part of raw) {
    if (!part.startsWith(`${AUTH_COOKIE_NAME}=`)) continue;
    const v = part.slice(AUTH_COOKIE_NAME.length + 1);
    if (v && v !== "0") return false;
  }
  setAuthCookieMarker();
  return true;
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthCookieMarker();
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
