"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { googleLogin } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { Spinner } from "@/components/Spinner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const hiddenBtnRef = useRef<HTMLDivElement>(null);

  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      setError("");
      setLoading(true);
      try {
        const data = await googleLogin(response.credential);
        setAuth(data.token, data.user);
        router.push("/dashboard");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID_HERE") return;

    function tryInit() {
      if (!window.google) return false;
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: handleCredential,
        ux_mode: "popup",
      });
      if (hiddenBtnRef.current) {
        window.google.accounts.id.renderButton(hiddenBtnRef.current, {
          type: "icon",
          size: "small",
        });
      }
      setReady(true);
      return true;
    }

    if (tryInit()) return;

    const interval = setInterval(() => {
      if (tryInit()) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [handleCredential]);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID_HERE") return null;

  const handleClick = () => {
    if (!ready || !window.google) return;
    const inner = hiddenBtnRef.current?.querySelector<HTMLElement>(
      'div[role="button"]',
    );
    if (inner) {
      inner.click();
    } else {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="w-full space-y-2">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Hidden Google-rendered button — we programmatically click it from our custom button */}
      <div ref={hiddenBtnRef} className="absolute overflow-hidden" style={{ width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />

      <button
        type="button"
        onClick={handleClick}
        disabled={!ready || loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:border-white/[0.12] disabled:opacity-50 transition-all"
      >
        {loading ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
    </div>
  );
}
