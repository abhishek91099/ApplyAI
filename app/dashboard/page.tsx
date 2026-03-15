"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/Spinner";
import { getApplications, deleteApplication } from "@/lib/api";
import type { Application } from "@/lib/types";

const STAT_CONFIG = [
  { key: "total" as const, label: "Total", icon: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z", color: "text-zinc-400" },
  { key: "applied" as const, label: "Applied", icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5", color: "text-blue-400" },
  { key: "interview" as const, label: "Interview", icon: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155", color: "text-violet-400" },
  { key: "offer" as const, label: "Offers", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z", color: "text-emerald-400" },
];

export default function DashboardPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, jobTitle: string) => {
    if (!confirm(`Delete application for "${jobTitle}"? This cannot be undone.`)) return;
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

  const stats = {
    total: apps.length,
    applied: apps.filter((a) => a.status === "Applied").length,
    interview: apps.filter((a) => a.status === "Interview").length,
    offer: apps.filter((a) => a.status === "Offer").length,
  };

  const avgScore =
    apps.filter((a) => a.ats_score).length > 0
      ? Math.round(
          apps.filter((a) => a.ats_score).reduce((s, a) => s + (a.ats_score || 0), 0) /
            apps.filter((a) => a.ats_score).length
        )
      : null;

  return (
    <div className="min-h-screen bg-base">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Track and manage your applications</p>
          </div>
          <Link
            href="/applications/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Application
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {STAT_CONFIG.map((s) => (
            <div key={s.key} className="rounded-2xl border border-white/[0.06] bg-surface p-5 hover:border-white/[0.1] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-4 w-4 ${s.color}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
                <p className="text-xs font-medium text-zinc-500">{s.label}</p>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{stats[s.key]}</p>
            </div>
          ))}
          {avgScore !== null && (
            <div className="rounded-2xl border border-white/[0.06] bg-surface p-5 hover:border-indigo-500/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <p className="text-xs font-medium text-zinc-500">Avg ATS</p>
              </div>
              <p className="text-2xl font-bold text-indigo-400">{avgScore}</p>
            </div>
          )}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-8 w-8 text-indigo-400" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl border border-white/[0.06] bg-surface flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-8 w-8 text-zinc-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">No applications yet</p>
              <p className="text-sm text-zinc-500 mt-1">Create your first application to get started</p>
            </div>
            <Link
              href="/applications/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all"
            >
              Create your first application
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-3.5 font-medium text-zinc-500 text-xs uppercase tracking-wider">Job</th>
                  <th className="text-left px-5 py-3.5 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Company</th>
                  <th className="text-center px-5 py-3.5 font-medium text-zinc-500 text-xs uppercase tracking-wider">ATS</th>
                  <th className="text-center px-5 py-3.5 font-medium text-zinc-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {apps.map((app) => (
                  <tr key={app.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">{app.job_title}</span>
                      <span className="block sm:hidden text-xs text-zinc-600 mt-0.5">{app.company}</span>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 hidden sm:table-cell">{app.company}</td>
                    <td className="px-5 py-4 text-center">
                      {app.ats_score != null ? (
                        <span
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-bold ${
                            app.ats_score >= 80
                              ? "text-emerald-400 bg-emerald-500/10"
                              : app.ats_score >= 60
                                ? "text-amber-400 bg-amber-500/10"
                                : "text-red-400 bg-red-500/10"
                          }`}
                        >
                          {app.ats_score}
                        </span>
                      ) : (
                        <span className="text-zinc-700">&mdash;</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-4 text-right text-zinc-600 text-xs hidden sm:table-cell">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/applications/${app.id}`}
                          className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 transition-all"
                        >
                          View
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(app.id, app.job_title); }}
                          disabled={deletingId === app.id}
                          className="rounded-lg p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all"
                          title="Delete"
                        >
                          {deletingId === app.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
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
        )}
      </div>
    </div>
  );
}
