"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { googleOAuthExchangeOnce } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { clearGoogleOAuthState, clearGoogleOAuthRedirect, getGoogleOAuthRedirectUri, readGoogleOAuthState, readGoogleOAuthRedirect } from "@/lib/googleOAuth";
import { Spinner } from "@/components/Spinner";
import { Logo } from "@/components/Logo";

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const err = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (err) {
      setPhase("error");
      setMessage(err === "access_denied" ? "Sign-in was cancelled." : "Google sign-in failed. Try again.");
      return;
    }

    if (!code || !state) {
      setPhase("error");
      setMessage("Missing sign-in data. Go back and try “Continue with Google” again.");
      return;
    }

    const saved = readGoogleOAuthState();
    if (!saved || saved !== state) {
      setPhase("error");
      setMessage("This sign-in link expired. Please try “Continue with Google” again.");
      return;
    }

    const redirectUri = getGoogleOAuthRedirectUri();
    if (!redirectUri) {
      setPhase("error");
      setMessage("Could not verify return URL.");
      return;
    }

    const postLoginRedirect = readGoogleOAuthRedirect();

    let cancelled = false;
    googleOAuthExchangeOnce(code, redirectUri)
      .then((data) => {
        if (cancelled) return;
        clearGoogleOAuthState();
        clearGoogleOAuthRedirect();
        setAuth(data.token, data.user);
        router.replace(postLoginRedirect);
        router.refresh();
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setPhase("error");
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        if (msg.includes("not configured") || msg.includes("GOOGLE_CLIENT_SECRET")) {
          setMessage("Google redirect sign-in is not configured on the server yet.");
        } else {
          setMessage(msg);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen flex-col bg-black text-[#f5f5f7]">
      <header className="border-b border-white/[0.08] px-6 py-4">
        <Logo size="default" linkTo="/" />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-12">
        {phase === "loading" ? (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-10 w-10 text-[#2997ff]" />
            <p className="text-[17px] text-[#a1a1a6]">{message}</p>
          </div>
        ) : (
          <div className="max-w-md text-center">
            <p className="text-[17px] leading-relaxed text-red-300">{message}</p>
            <Link
              href="/login"
              className="mt-8 inline-flex rounded-full bg-[#2997ff] px-6 py-3 text-[17px] text-white hover:bg-[#147ce5]"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function CallbackFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-[#f5f5f7]">
      <Spinner className="h-10 w-10 text-[#2997ff]" />
    </main>
  );
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
