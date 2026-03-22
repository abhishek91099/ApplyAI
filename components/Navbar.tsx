"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";

function navLinkClass(active: boolean) {
  return active
    ? "text-[#f5f5f7]"
    : "text-[#a1a1a6] transition-colors hover:text-[#f5f5f7]";
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[48px] max-w-[1024px] items-center justify-between px-6 md:h-[52px]">
        <Logo size="default" linkTo={user ? "/dashboard" : "/"} />

        <nav className="flex items-center gap-6 text-[12px] md:gap-8 md:text-[14px]">
          {user ? (
            <>
              <Link href="/dashboard" className={navLinkClass(pathname === "/dashboard")}>
                Home
              </Link>
              <Link href="/resume" className={navLinkClass(pathname === "/resume")}>
                Résumé
              </Link>
              <Link href="/research" className={navLinkClass(pathname === "/research")}>
                Intelligence
              </Link>
              <span className="hidden max-w-[160px] truncate text-[#6e6e73] md:inline">
                {user.name || user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[#a1a1a6] transition-colors hover:text-[#f5f5f7]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[#a1a1a6] transition-colors hover:text-[#f5f5f7]">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#2997ff] px-5 py-2 text-white transition-colors hover:bg-[#147ce5]"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
