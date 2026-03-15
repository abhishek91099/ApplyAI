"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-base/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <Logo size="default" linkTo={user ? "/dashboard" : "/"} />

        <nav className="flex min-w-0 flex-shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/applications/new"
                className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-indigo-400 hover:bg-indigo-500/20 transition-all"
              >
                + New
              </Link>
              <div className="h-5 w-px bg-white/[0.06] mx-1" />
              <div className="flex items-center gap-2">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-7 w-7 rounded-full ring-2 ring-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                    {(user.name || user.email || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden max-w-[120px] truncate text-xs text-zinc-500 sm:block sm:text-sm">
                  {user.name || user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white transition-all"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-accent px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
