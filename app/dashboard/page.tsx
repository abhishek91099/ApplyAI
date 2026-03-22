"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/Spinner";
import { getApplications, deleteApplication } from "@/lib/api";
import type { ApplicationSummary } from "@/lib/types";

function HubCard({
  href,
  step,
  title,
  description,
  cta,
  delayClass,
  orbSide,
}: {
  href: string;
  step: string;
  title: string;
  description: string;
  cta: string;
  delayClass: string;
  orbSide: "right" | "left";
}) {
  return (
    <Link
      href={href}
      className={`animate-rise-in ${delayClass} group relative flex min-h-[260px] flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#1d1d1f] p-8 shadow-apple-hero transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] hover:shadow-glow-brand md:min-h-[280px]`}
    >
      <div
        className={`pointer-events-none absolute h-48 w-48 rounded-full bg-[#2997ff]/20 blur-[64px] animate-apple-glow ${
          orbSide === "right" ? "-right-10 -top-10" : "-bottom-12 -left-8"
        }`}
        aria-hidden
      />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#2997ff]/12 text-[13px] font-semibold text-[#2997ff] transition-transform duration-300 group-hover:scale-105">
        {step}
      </div>
      <h2 className="relative mt-6 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#f5f5f7] sm:text-[26px]">
        {title}
      </h2>
      <p className="relative mt-3 max-w-sm flex-1 text-[15px] leading-relaxed text-[#a1a1a6] sm:text-[17px]">{description}</p>
      <span className="relative mt-8 inline-flex items-center gap-2 text-[15px] font-medium text-[#2997ff] transition-transform duration-300 group-hover:gap-3">
        {cta}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.638l-3.158-3.096a.75.75 0 011.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 11-1.04-1.08l3.157-3.096H3.75A.75.75 0 013 10z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </Link>
  );
}

export default function DashboardPage() {
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, jobTitle: string) => {
    if (!confirm(`Delete "${jobTitle}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteApplication(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    getApplications()
      .then(setApps)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7]">
      <Navbar />

      <div className="mx-auto max-w-[1024px] min-w-0 space-y-14 px-6 py-12 md:space-y-16 md:py-16">
        <header className="space-y-4">
          <p className="animate-rise-in text-[12px] font-medium uppercase tracking-[0.14em] text-[#86868b]">{greeting}</p>
          <h1 className="animate-rise-in rise-delay-1 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#f5f5f7] md:text-[40px]">
            Your workspace
          </h1>
          <p className="animate-rise-in rise-delay-2 max-w-xl text-[17px] leading-relaxed text-[#a1a1a6] md:text-[19px]">
            Same look as the site you signed up on — refine materials, then prep for the interview.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <HubCard
            href="/resume"
            step="01"
            title="Résumé studio"
            description="Tailor, ATS scoring, cover letter, and follow-up drafts aligned to the posting."
            cta="Open studio"
            delayClass="rise-delay-1"
            orbSide="right"
          />
          <HubCard
            href="/research"
            step="02"
            title="Intelligence"
            description="Deep interview prep for the role in front of you — questions, angles, and narrative."
            cta="Open intelligence"
            delayClass="rise-delay-2"
            orbSide="left"
          />
        </div>

        <section className="space-y-5">
          <div className="animate-rise-in rise-delay-3">
            <h2 className="text-[21px] font-semibold text-[#f5f5f7]">Archive</h2>
            <p className="mt-1 text-[14px] text-[#a1a1a6]">Saved applications — open to edit or export.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner className="h-9 w-9 text-[#2997ff]" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
          ) : apps.length === 0 ? (
            <div className="apple-panel animate-rise-in rise-delay-3 flex flex-col items-center px-6 py-16 text-center sm:py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-[#2d2d2f]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-7 w-7 text-[#86868b]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <p className="mt-6 text-[21px] font-semibold text-[#f5f5f7]">Nothing archived yet</p>
              <p className="mt-2 max-w-sm text-[17px] leading-relaxed text-[#a1a1a6]">
                Run a role through the studio — saves land here automatically.
              </p>
              <Link href="/resume" className="btn-primary mt-8 min-w-[200px] justify-center py-3.5">
                Start in Résumé studio
              </Link>
            </div>
          ) : (
            <div className="apple-panel animate-rise-in rise-delay-3 overflow-hidden p-0">
              <div className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#86868b]">
                  {apps.length} saved {apps.length === 1 ? "role" : "roles"}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-[#86868b] sm:px-6">Role</th>
                      <th className="hidden px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-[#86868b] sm:table-cell sm:px-6">
                        Company
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-[#86868b] sm:px-6">
                        ATS
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-[#86868b] sm:px-6">
                        Status
                      </th>
                      <th className="hidden px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-[#86868b] sm:table-cell sm:px-6">
                        Added
                      </th>
                      <th className="px-5 py-3.5 sm:px-6" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app, i) => (
                      <tr
                        key={app.id}
                        className="group border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.03]"
                        style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <span className="font-medium text-[#f5f5f7] transition-colors group-hover:text-white">
                            {app.job_title}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#86868b] sm:hidden">{app.company}</span>
                        </td>
                        <td className="hidden px-5 py-4 text-[#a1a1a6] sm:table-cell sm:px-6">{app.company}</td>
                        <td className="px-5 py-4 text-center sm:px-6">
                          {app.ats_score != null ? (
                            <span
                              className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums ${
                                app.ats_score >= 80
                                  ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                                  : app.ats_score >= 60
                                    ? "border border-amber-500/25 bg-amber-500/10 text-amber-300"
                                    : "border border-red-500/25 bg-red-500/10 text-red-300"
                              }`}
                            >
                              {app.ats_score}
                            </span>
                          ) : (
                            <span className="text-[#6e6e73]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center sm:px-6">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="hidden px-5 py-4 text-right text-xs tabular-nums text-[#86868b] sm:table-cell sm:px-6">
                          {new Date(app.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4 text-right sm:px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/applications/${app.id}`}
                              className="rounded-full border border-[#2997ff]/35 bg-[#2997ff]/10 px-3 py-1.5 text-xs font-semibold text-[#2997ff] transition-colors hover:bg-[#2997ff]/18"
                            >
                              Open
                            </Link>
                            <Link
                              href={`/research?applicationId=${encodeURIComponent(app.id)}`}
                              className="hidden rounded-full border border-white/[0.1] px-2.5 py-1.5 text-[11px] font-medium text-[#a1a1a6] transition-colors hover:border-white/[0.18] hover:text-[#f5f5f7] sm:inline-flex"
                              title="Intelligence"
                            >
                              Intel
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(app.id, app.job_title);
                              }}
                              disabled={deletingId === app.id}
                              className="rounded-lg p-2 text-[#86868b] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === app.id ? (
                                <Spinner className="h-3.5 w-3.5" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path
                                    fillRule="evenodd"
                                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
