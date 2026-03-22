"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { Spinner } from "@/components/Spinner";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Logo } from "@/components/Logo";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await signup(email, password);
      setAuth(data.token, data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-page-bg relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-25" />
      <div className="pointer-events-none absolute right-0 top-0 h-[min(55vh,480px)] w-[min(55vw,420px)] rounded-full bg-fuchsia-600/[0.08] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[min(50vh,400px)] w-[min(50vw,380px)] rounded-full bg-brand-500/[0.07] blur-[100px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row-reverse">
        <div className="relative hidden flex-1 flex-col justify-between p-10 lg:flex xl:p-14">
          <Logo size="default" linkTo="/" />
          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-fuchsia-400/80">
              New workspace
            </p>
            <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Your applications, organized like a product roadmap.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
              From first tailor to final follow-up — everything lives in one
              calm, fast interface.
            </p>
          </div>
          <p className="text-xs text-zinc-600">Free to start · Upgrade later if we add tiers</p>
        </div>

        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <div className="mb-8 flex justify-center lg:hidden">
                <Logo size="large" linkTo="/" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Start optimizing applications in minutes
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card-elevated space-y-5 p-6 sm:p-8">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-sm text-red-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-modern"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern"
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading && <Spinner className="h-4 w-4" />}
                Create account
              </button>
            </form>

            <div className="relative px-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-base/90 px-3 font-medium uppercase tracking-wider text-zinc-600">
                  or continue with
                </span>
              </div>
            </div>

            <div className="px-2">
              <GoogleSignInButton />
            </div>

            <p className="text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand-400 transition-colors hover:text-brand-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
