const STATE_KEY = "applyai_google_oauth_state";
const REDIRECT_KEY = "applyai_google_oauth_redirect";

/**
 * Full-page redirect to Google OAuth (works in in-app browsers; no GIS script required).
 */
export function startGoogleOAuthRedirect(redirectTo?: string): boolean {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID_HERE") return false;
  if (typeof window === "undefined") return false;

  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  if (redirectTo && redirectTo !== "/dashboard") {
    sessionStorage.setItem(REDIRECT_KEY, redirectTo);
  } else {
    sessionStorage.removeItem(REDIRECT_KEY);
  }
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  return true;
}

export function readGoogleOAuthState(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STATE_KEY);
}

export function clearGoogleOAuthState(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STATE_KEY);
}

export function readGoogleOAuthRedirect(): string {
  if (typeof window === "undefined") return "/dashboard";
  return sessionStorage.getItem(REDIRECT_KEY) || "/dashboard";
}

export function clearGoogleOAuthRedirect(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(REDIRECT_KEY);
}

export function getGoogleOAuthRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/google/callback`;
}
