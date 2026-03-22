"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Spinner } from "@/components/Spinner";
import { CopyButton } from "@/components/CopyButton";
import { ATSScore } from "@/components/ATSScore";
import { StatusBadge } from "@/components/StatusBadge";
import { ExportButton } from "@/components/ExportButton";
import { ResumeEditor } from "@/components/ResumeEditor";
import { InterviewPrepView } from "@/components/InterviewPrepView";
import { CoverLetterPdfButton } from "@/components/CoverLetterPdfButton";
import { getApplication, updateApplication, deleteApplication } from "@/lib/api";
import type { Application } from "@/lib/types";

const STATUSES = ["Applied", "Interview", "Rejected", "Offer"] as const;
const TAB_CONFIG = [
  { key: "resume" as const, label: "Resume", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
  { key: "cover" as const, label: "Cover Letter", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
  { key: "followup" as const, label: "Emails", icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" },
  { key: "prep" as const, label: "Intelligence", icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" },
];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"resume" | "cover" | "followup" | "prep">("resume");

  useEffect(() => { getApplication(id).then(setApp).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!app) return; setUpdatingStatus(true);
    try { const updated = await updateApplication(app.id, { status: newStatus }); setApp({ ...app, status: updated.status }); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Status update failed"); }
    finally { setUpdatingStatus(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#f5f5f7]">
        <Navbar />
        <div className="flex justify-center py-28">
          <Spinner className="h-9 w-9 text-[#2997ff]" />
        </div>
      </div>
    );
  }
  if (error || !app) {
    return (
      <div className="min-h-screen bg-black text-[#f5f5f7]">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="apple-panel border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300/95">{error || "Application not found"}</div>
          <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2997ff] transition-colors hover:text-[#f5f5f7]">
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  const followUpEmails = app.follow_up_emails || [];
  const scoreDetails = app.score_details;
  const resumeMeta = app.resume_meta;
  const coverMeta = app.cover_letter_meta;

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7]">
      <Navbar />
      <div className="mx-auto max-w-[1024px] min-w-0 space-y-6 px-6 py-8 sm:space-y-8 sm:py-10">
        <Link
          href="/dashboard"
          className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#a1a1a6] transition-all hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-[#f5f5f7]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Dashboard
        </Link>

        <div className="apple-panel relative overflow-hidden p-4 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2997ff]/35 to-transparent" />
          <div className="relative flex flex-wrap items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold leading-tight tracking-[-0.02em] text-[#f5f5f7] sm:text-2xl">{app.job_title}</h1>
              <p className="mt-1 text-sm text-[#a1a1a6]">{app.company}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#a1a1a6]/80">
                <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                {app.experience_years != null && <><span className="text-[#a1a1a6]/40">&middot;</span><span>{app.experience_years} yrs</span></>}
                {app.current_role && <><span className="text-[#a1a1a6]/40">&middot;</span><span>{app.current_role}</span></>}
                {app.is_career_change && <><span className="text-[#a1a1a6]/40">&middot;</span><span className="text-amber-400/90">Career change</span></>}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:justify-start">
              {app.ats_score != null && <ATSScore score={app.ats_score} />}
              <ExportButton application={app} />
              <div className="flex items-center gap-2">
                <StatusBadge status={app.status} />
                <select value={app.status} onChange={(e) => handleStatusChange(e.target.value)} disabled={updatingStatus} className="rounded-lg border border-white/[0.12] bg-black/40 px-2.5 py-1.5 text-xs font-medium text-[#f5f5f7] focus:border-[#2997ff]/50 focus:outline-none focus:ring-2 focus:ring-[#2997ff]/20">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="button" onClick={async () => { if (!confirm(`Delete "${app.job_title}"?`)) return; setDeleting(true); try { await deleteApplication(app.id); router.push("/dashboard"); } catch (e: unknown) { setError(e instanceof Error ? e.message : "Delete failed"); setDeleting(false); } }} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-300/95 transition-all hover:bg-red-950/60 disabled:opacity-50">
                {deleting ? <Spinner className="h-3.5 w-3.5" /> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>}
                Delete
              </button>
            </div>
          </div>

          {scoreDetails?.score_breakdown && (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(scoreDetails.score_breakdown).map(([key, val]) => (
                <div key={key} className="rounded-xl border border-white/[0.08] bg-black/25 p-3 text-center">
                  <p className="text-lg font-semibold text-[#f5f5f7]">{val as number}<span className="text-xs text-[#a1a1a6]">%</span></p>
                  <p className="text-xs capitalize text-[#a1a1a6]">{key.replace("_", " ")}</p>
                </div>
              ))}
            </div>
          )}
          {app.keywords && app.keywords.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{app.keywords.map((k) => <span key={k} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300/90">{k}</span>)}</div>}
          {app.missing_keywords && app.missing_keywords.length > 0 && <div className="mt-2"><p className="mb-1.5 text-xs text-[#a1a1a6]">Missing:</p><div className="flex flex-wrap gap-1.5">{app.missing_keywords.map((k) => <span key={k} className="rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-300/90">{k}</span>)}</div></div>}
          {(scoreDetails?.critical_issues?.length ?? 0) > 0 && <div className="mt-4"><p className="mb-1.5 text-xs font-semibold text-red-400/90">Critical issues:</p><ul className="space-y-0.5">{scoreDetails!.critical_issues.map((issue: string, i: number) => <li key={i} className="flex gap-2 text-xs text-red-300/85"><span className="shrink-0">!</span> {issue}</li>)}</ul></div>}
          {(scoreDetails?.quick_wins?.length ?? 0) > 0 && <div className="mt-3"><p className="mb-1.5 text-xs font-semibold text-emerald-400/90">Quick wins:</p><ul className="space-y-0.5">{scoreDetails!.quick_wins.map((win: string, i: number) => <li key={i} className="flex gap-2 text-xs text-emerald-300/85"><span className="shrink-0">+</span> {win}</li>)}</ul></div>}
        </div>

        <nav className="flex flex-nowrap gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#161618]/95 p-1.5 backdrop-blur-md">
          {TAB_CONFIG.map(({ key, label, icon }) => {
            const disabled =
              key === "resume"
                ? !app.tailored_resume
                : key === "cover"
                  ? !app.cover_letter
                  : key === "followup"
                    ? followUpEmails.length === 0
                    : false;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                disabled={disabled}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === key
                    ? "bg-[#2997ff]/15 text-[#f5f5f7] shadow-glow-brand ring-1 ring-[#2997ff]/25"
                    : !disabled
                      ? "text-[#a1a1a6] hover:bg-white/[0.04] hover:text-[#f5f5f7]"
                      : "cursor-not-allowed text-[#a1a1a6]/40 opacity-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0 opacity-80">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="apple-panel p-6 sm:p-8">
          {activeTab === "resume" && app.tailored_resume && (
            <div className="space-y-4">
              <ResumeEditor applicationId={app.id} initialText={app.tailored_resume} originalResume={app.original_resume} jobTitle={app.job_title} company={app.company} onSave={(text) => setApp({ ...app, tailored_resume: text })} />
              {(resumeMeta?.changes_made?.length ?? 0) > 0 && <div className="border-t border-white/[0.04] pt-4"><p className="text-xs font-semibold text-zinc-500 mb-2">Changes:</p><ul className="space-y-1">{resumeMeta!.changes_made.map((c: string, i: number) => <li key={i} className="text-xs text-zinc-400 flex gap-2"><span className="text-brand-400 shrink-0">-</span> {c}</li>)}</ul></div>}
              {(resumeMeta?.keywords_added?.length ?? 0) > 0 && <div><p className="text-xs font-semibold text-zinc-500 mb-2">Keywords added:</p><div className="flex flex-wrap gap-1.5">{resumeMeta!.keywords_added.map((k: string) => <span key={k} className="rounded-full bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 text-xs font-medium text-brand-400">{k}</span>)}</div></div>}
            </div>
          )}

          {activeTab === "cover" && app.cover_letter && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-zinc-200">Cover Letter</h3>{coverMeta?.tone_used && <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-400">{coverMeta.tone_used}</span>}</div>
                <CopyButton text={app.cover_letter} />
              </div>
              <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{app.cover_letter}</p>
              {(coverMeta?.key_selling_points_used?.length ?? 0) > 0 && <div className="border-t border-white/[0.04] pt-4"><p className="text-xs font-semibold text-zinc-500 mb-2">Key selling points:</p><div className="flex flex-wrap gap-1.5">{coverMeta!.key_selling_points_used.map((p: string, i: number) => <span key={i} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">{p}</span>)}</div></div>}
              <CoverLetterPdfButton text={app.cover_letter} jobTitle={app.job_title} company={app.company} candidateName={app.candidate_name || undefined} />
            </div>
          )}

          {activeTab === "followup" && followUpEmails.length > 0 && (
            <div className="space-y-6">
              {followUpEmails.map((email, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-zinc-400">{email.type}</span><span className="text-sm font-semibold text-zinc-200">{email.subject}</span></div>
                    <CopyButton text={`Subject: ${email.subject}\n\n${email.body}`} />
                  </div>
                  {email.when_to_send && <p className="text-xs text-brand-400 font-medium">Send: {email.when_to_send}</p>}
                  <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap pl-1">{email.body}</p>
                  {i < followUpEmails.length - 1 && <hr className="border-white/[0.04]" />}
                </div>
              ))}
            </div>
          )}

          {activeTab === "prep" && app.interview_prep && (
            <div className="space-y-4">
              <p className="text-xs text-[#a1a1a6]">
                Regenerate or refine in{" "}
                <Link href={`/research?applicationId=${encodeURIComponent(app.id)}`} className="text-[#2997ff] underline decoration-[#2997ff]/35 underline-offset-4 hover:decoration-[#2997ff]/60">
                  Intelligence
                </Link>
                .
              </p>
              <InterviewPrepView prep={app.interview_prep} />
            </div>
          )}
          {activeTab === "prep" && !app.interview_prep && (
            <div className="space-y-6 py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.1] bg-[#2997ff]/10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-8 w-8 text-[#2997ff]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              </div>
              <div>
                <p className="text-[21px] font-semibold text-[#f5f5f7]">No intelligence dossier yet</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[#a1a1a6]">
                  Build deep interview prep in the intelligence suite — we&apos;ll pre-fill this role.
                </p>
              </div>
              <Link href={`/research?applicationId=${encodeURIComponent(app.id)}`} className="btn-primary inline-flex">
                Open intelligence suite
              </Link>
            </div>
          )}

          {activeTab === "resume" && !app.tailored_resume && <p className="py-12 text-center text-sm text-[#a1a1a6]">No tailored résumé</p>}
          {activeTab === "cover" && !app.cover_letter && <p className="py-12 text-center text-sm text-[#a1a1a6]">No cover letter</p>}
          {activeTab === "followup" && followUpEmails.length === 0 && <p className="py-12 text-center text-sm text-[#a1a1a6]">No follow-up emails</p>}
        </div>
      </div>
    </div>
  );
}
