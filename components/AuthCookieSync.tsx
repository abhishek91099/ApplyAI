"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getToken, syncAuthCookieFromStorage } from "@/lib/auth";

function AuthCookieSyncInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!getToken()) return;
    syncAuthCookieFromStorage();
    if (pathname === "/login" || pathname === "/signup") {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.replace(redirect);
    }
  }, [pathname, router, searchParams]);

  return null;
}

/**
 * Middleware only sees cookies; auth token lives in localStorage. Repairs the
 * marker cookie when needed. Also bounces off auth pages if you already have a token
 * (e.g. middleware sent you to /login before the cookie was restored).
 */
export function AuthCookieSync() {
  return (
    <Suspense fallback={null}>
      <AuthCookieSyncInner />
    </Suspense>
  );
}
