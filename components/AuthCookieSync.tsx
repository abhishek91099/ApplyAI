"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken, syncAuthCookieFromStorage } from "@/lib/auth";

/**
 * Middleware only sees cookies; auth token lives in localStorage. Repairs the
 * marker cookie when needed. Also bounces off auth pages if you already have a token
 * (e.g. middleware sent you to /login before the cookie was restored).
 */
export function AuthCookieSync() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getToken()) return;
    syncAuthCookieFromStorage();
    if (pathname === "/login" || pathname === "/signup") {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  return null;
}
