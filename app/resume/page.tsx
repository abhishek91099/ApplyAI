"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Spinner } from "@/components/Spinner";
import { CopyButton } from "@/components/CopyButton";
import { ATSScore } from "@/components/ATSScore";
import { CoverLetterPdfButton } from "@/components/CoverLetterPdfButton";
import { DiffView } from "@/components/DiffView";
import {
  tailorResume,
  scoreResume,
  generateCoverLetter,
  generateFollowUps,
  saveApplication,
  extractPdf,
  extractUrl,
  extractCandidateInfo,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { TailorResult, ScoreResult, CoverLetterResult, FollowUpEmail } from "@/lib/types";

const INPUT_CLASS = "input-modern";
const TEXTAREA_CLASS = "input-modern min-h-[160px] resize-y";

const TAB_CONFIG = [
  {
    key: "resume" as const,
    label: "Résumé",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  {
    key: "cover" as const,
    label: "Cover letter",
    icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  },
  {
    key: "followup" as const,
    label: "Outreach",
    icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
  },
];

export default function ResumeStudioPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [currentRole, setCurrentRole] = useState("");
  const [isCareerChange, setIsCareerChange] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [extractingUrl, setExtractingUrl] = useState(false);

  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [coverLetterResult, setCoverLetterResult] = useState<CoverLetterResult | null>(null);
  const [followUpEmails, setFollowUpEmails] = useState<FollowUpEmail[]>([]);

  const [editedResume, setEditedResume] = useState("");
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const [resumeView, setResumeView] = useState<"after" | "compare">("after");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractingInfo, setExtractingInfo] = useState(false);
  const [infoAutoFilled, setInfoAutoFilled] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"resume" | "cover" | "followup">("resume");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const extractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasResults = !!(tailorResult || scoreResult || coverLetterResult || followUpEmails.length > 0);
  const canGenerate = resumeText.trim() && jobDescription.trim() && jobTitle.trim() && company.trim();

  const autoExtractInfo = (text: string) => {
    if (!text.trim() || text.trim().length < 50) return;
    if (extractTimerRef.current) clearTimeout(extractTimerRef.current);
    extractTimerRef.current = setTimeout(async () => {
      setExtractingInfo(true);
      try {
        const info = await extractCandidateInfo(text);
        if (info.name) setCandidateName(info.name);
        if (info.current_role) setCurrentRole(info.current_role);
        if (info.experience_years) setExperienceYears(info.experience_years);
        setInfoAutoFilled(true);
      } catch {
        /* silent */
      } finally {
        setExtractingInfo(false);
      }
    }, 600);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setError("");
    try {
      const text = await extractPdf(file);
      setResumeText(text);
      autoExtractInfo(text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "PDF extraction failed");
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    setTailorResult(null);
    setScoreResult(null);
    setCoverLetterResult(null);
    setFollowUpEmails([]);
    try {
      const [tailor, score, cover, followups] = await Promise.all([
        tailorResume(resumeText, jobDescription, experienceYears, currentRole, jobTitle, isCareerChange),
        scoreResume(resumeText, jobDescription),
        generateCoverLetter(
          resumeText,
          jobDescription,
          company,
          candidateName,
          experienceYears,
          currentRole,
          jobTitle,
          isCareerChange
        ),
        generateFollowUps(jobTitle, company, candidateName),
      ]);
      setTailorResult(tailor);
      setEditedResume(tailor.tailored_resume);
      setScoreResult(score);
      setCoverLetterResult(cover);
      setEditedCoverLetter(cover.cover_letter);
      setFollowUpEmails(followups.emails);
      setActiveTab("resume");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!getToken()) {
      setShowAuthPrompt(true);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const app = await saveApplication({
        job_title: jobTitle,
        company,
        job_description: jobDescription,
        candidate_name: candidateName || null,
        experience_years: experienceYears || null,
        current_role: currentRole || null,
        is_career_change: isCareerChange,
        original_resume: resumeText,
        tailored_resume: editedResume || tailorResult?.tailored_resume || null,
        resume_meta: tailorResult
          ? { changes_made: tailorResult.changes_made, keywords_added: tailorResult.keywords_added }
          : null,
        ats_score: scoreResult?.ats_score || null,
        score_details: scoreResult
          ? {
              score_breakdown: scoreResult.score_breakdown,
              critical_issues: scoreResult.critical_issues,
              quick_wins: scoreResult.quick_wins,
            }
          : null,
        keywords: scoreResult?.matched_keywords || [],
        missing_keywords: scoreResult?.missing_keywords || [],
        cover_letter: editedCoverLetter || coverLetterResult?.cover_letter || null,
        cover_letter_meta: coverLetterResult
          ? { tone_used: coverLetterResult.tone_used, key_selling_points_used: coverLetterResult.key_selling_points_used }
          : null,
        follow_up_emails: followUpEmails,
        interview_prep: null,
        status: "Applied",
      });
      router.push(`/applications/${app.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7]">
      <Navbar />
      <div className="mx-auto max-w-[1024px] min-w-0 space-y-8 px-6 py-10 md:py-14">
        <div className="animate-rise-in relative space-y-4">
          <div className="h-px w-24 bg-gradient-to-r from-[#2997ff]/45 to-transparent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-[#86868b]">Résumé studio</p>
          <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#f5f5f7] sm:text-[40px]">
            Materials for your next offer
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#a1a1a6]">
            One pass: tailored résumé, ATS readout, cover letter, and follow-up notes. Interview intelligence lives on{" "}
            <Link href="/research" className="text-[#2997ff] underline decoration-[#2997ff]/35 underline-offset-4 hover:decoration-[#2997ff]/60">
              Intelligence
            </Link>
            .
          </p>
        </div>

        <div className="apple-panel animate-rise-in rise-delay-1 space-y-8 p-6 sm:p-9">
          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-[26px] font-semibold text-[#86868b]/55">01</span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">Target role</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-[#a1a1a6]">
                  Role <span className="text-red-400/90">*</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Principal Product Designer"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#a1a1a6]">
                  Company <span className="text-red-400/90">*</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Atelier Global"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-[26px] font-semibold text-[#86868b]/55">02</span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">About you</h2>
              {extractingInfo && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#2997ff]/90 animate-pulse">
                  <Spinner className="h-3 w-3" /> Reading résumé…
                </span>
              )}
              {infoAutoFilled && !extractingInfo && (
                <span className="text-xs text-emerald-400/80">Prefilled from document</span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm text-[#a1a1a6]">Your name</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => {
                    setCandidateName(e.target.value);
                    setInfoAutoFilled(false);
                  }}
                  placeholder="From résumé"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#a1a1a6]">Experience (years)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={experienceYears || ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setExperienceYears(v ? parseInt(v, 10) : 0);
                    setInfoAutoFilled(false);
                  }}
                  placeholder="—"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#a1a1a6]">Current title</label>
                <input
                  type="text"
                  value={currentRole}
                  onChange={(e) => {
                    setCurrentRole(e.target.value);
                    setInfoAutoFilled(false);
                  }}
                  placeholder="From résumé"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 group">
              <input
                type="checkbox"
                checked={isCareerChange}
                onChange={(e) => setIsCareerChange(e.target.checked)}
                className="h-4 w-4 rounded border-[#2997ff]/35 bg-black/40 text-[#2997ff] focus:ring-[#2997ff]/25"
              />
              <span className="text-sm text-[#a1a1a6] transition-colors group-hover:text-[#f5f5f7]/90">Career pivot</span>
            </label>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-[26px] font-semibold text-[#86868b]/55">03</span>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                  Résumé <span className="text-red-400/90">*</span>
                </h2>
              </div>
              <label className="btn-ghost-apple cursor-pointer py-2 text-xs">
                {extracting ? (
                  <>
                    <Spinner className="h-3 w-3" /> Extracting…
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                    PDF
                  </>
                )}
                <input ref={fileRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              </label>
            </div>
            <textarea
              rows={8}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (pasted.length > 50) setTimeout(() => autoExtractInfo(pasted), 100);
              }}
              placeholder="Paste résumé text or upload a PDF…"
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <div>
            <div className="mb-3 flex items-baseline gap-3">
              <span className="text-[26px] font-semibold text-[#86868b]/55">04</span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                Job description <span className="text-red-400/90">*</span>
              </h2>
            </div>
            <div className="mb-3 flex gap-2">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="Job posting URL (optional)"
                className="input-modern min-h-0 flex-1 py-2.5"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!jobUrl.trim()) return;
                  setExtractingUrl(true);
                  setError("");
                  try {
                    setJobDescription(await extractUrl(jobUrl.trim()));
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : "URL extraction failed");
                  } finally {
                    setExtractingUrl(false);
                  }
                }}
                disabled={!jobUrl.trim() || extractingUrl}
                className="btn-ghost-apple shrink-0 px-4"
              >
                {extractingUrl ? <Spinner className="h-3.5 w-3.5" /> : "Pull"}
              </button>
            </div>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Full posting text…"
              className={TEXTAREA_CLASS}
            />
          </div>

          <button type="button" onClick={handleGenerate} disabled={!canGenerate || generating} className="btn-primary w-full sm:w-auto">
            {generating && <Spinner className="h-4 w-4" />}
            {generating ? "Composing…" : "Analyze & generate"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-950/40 p-4 text-sm text-red-300/95">{error}</div>
        )}

        {hasResults && (
          <div className="space-y-8">
            {scoreResult && (
              <div className="apple-panel space-y-5 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-5">
                  <ATSScore score={scoreResult.ats_score} />
                  <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(scoreResult.score_breakdown).map(([key, val]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-white/[0.08] bg-black/25 p-3 text-center shadow-inner"
                      >
                        <p className="text-lg font-semibold text-[#f5f5f7]">
                          {val}
                          <span className="text-xs text-[#a1a1a6]">%</span>
                        </p>
                        <p className="text-[11px] capitalize text-[#a1a1a6]">{key.replace("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {scoreResult.matched_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {scoreResult.matched_keywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300/90"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
                {scoreResult.missing_keywords.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-[#a1a1a6]">Gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {scoreResult.missing_keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-300/90"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {scoreResult.critical_issues.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-red-400/90">Critical</p>
                    <ul className="space-y-1">
                      {scoreResult.critical_issues.map((issue, i) => (
                        <li key={i} className="flex gap-2 text-xs text-red-300/85">
                          <span className="shrink-0">!</span> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {scoreResult.quick_wins.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-emerald-400/90">Quick wins</p>
                    <ul className="space-y-1">
                      {scoreResult.quick_wins.map((win, i) => (
                        <li key={i} className="flex gap-2 text-xs text-emerald-300/85">
                          <span className="shrink-0">+</span> {win}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <nav className="flex flex-nowrap gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#161618]/95 p-1.5 backdrop-blur-md sm:flex-wrap">
              {TAB_CONFIG.map(({ key, label, icon }) => {
                const has =
                  key === "resume" ? !!tailorResult : key === "cover" ? !!coverLetterResult : followUpEmails.length > 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    disabled={!has}
                    className={`inline-flex min-w-0 shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      activeTab === key
                        ? "bg-[#2997ff]/15 text-[#f5f5f7] shadow-glow-brand ring-1 ring-[#2997ff]/25"
                        : has
                          ? "text-[#a1a1a6] hover:bg-white/[0.04] hover:text-[#f5f5f7]"
                          : "cursor-not-allowed text-[#a1a1a6]/40 opacity-50"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4 shrink-0 opacity-80"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="apple-panel p-6 sm:p-8">
              {activeTab === "resume" && tailorResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-[#f5f5f7]">Tailored résumé</h3>
                      <div className="flex rounded-xl border border-white/[0.1] bg-black/30 p-0.5">
                        <button
                          type="button"
                          onClick={() => setResumeView("after")}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                            resumeView === "after" ? "bg-[#2997ff]/15 text-[#f5f5f7]" : "text-[#a1a1a6] hover:text-[#f5f5f7]"
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setResumeView("compare")}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                            resumeView === "compare" ? "bg-[#2997ff]/15 text-[#f5f5f7]" : "text-[#a1a1a6] hover:text-[#f5f5f7]"
                          }`}
                        >
                          Compare
                        </button>
                      </div>
                    </div>
                    <CopyButton text={editedResume} />
                  </div>
                  {resumeView === "after" && (
                    <div className="space-y-2">
                      <textarea
                        value={editedResume}
                        onChange={(e) => setEditedResume(e.target.value)}
                        rows={20}
                        className="input-modern min-h-[320px] resize-y font-mono text-sm leading-relaxed"
                      />
                      {editedResume !== tailorResult.tailored_resume && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-amber-400/90">Unsaved edits</span>
                          <button
                            type="button"
                            onClick={() => setEditedResume(tailorResult.tailored_resume)}
                            className="text-xs text-[#a1a1a6] underline hover:text-[#f5f5f7]"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {resumeView === "compare" && <DiffView before={resumeText} after={editedResume} />}
                  {tailorResult.changes_made?.length > 0 && (
                    <div className="border-t border-white/[0.08] pt-4">
                      <p className="mb-2 text-xs font-semibold text-[#a1a1a6]">Changes</p>
                      <ul className="space-y-1">
                        {tailorResult.changes_made.map((c, i) => (
                          <li key={i} className="flex gap-2 text-xs text-[#a1a1a6]">
                            <span className="shrink-0 text-[#2997ff]">—</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {tailorResult.keywords_added?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[#a1a1a6]">Keywords added</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tailorResult.keywords_added.map((k) => (
                          <span
                            key={k}
                            className="rounded-full border border-[#2997ff]/30 bg-[#2997ff]/10 px-2.5 py-0.5 text-xs font-medium text-[#2997ff]"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "cover" && coverLetterResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#f5f5f7]">Cover letter</h3>
                      {coverLetterResult.tone_used && (
                        <span className="rounded-full border border-white/[0.1] bg-[#2997ff]/10 px-2.5 py-0.5 text-xs font-medium text-[#2997ff]">
                          {coverLetterResult.tone_used}
                        </span>
                      )}
                    </div>
                    <CopyButton text={editedCoverLetter} />
                  </div>
                  <textarea
                    value={editedCoverLetter}
                    onChange={(e) => setEditedCoverLetter(e.target.value)}
                    rows={14}
                    className="input-modern min-h-[280px] resize-y text-sm leading-relaxed"
                  />
                  {editedCoverLetter !== coverLetterResult.cover_letter && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-400/90">Unsaved edits</span>
                      <button
                        type="button"
                        onClick={() => setEditedCoverLetter(coverLetterResult.cover_letter)}
                        className="text-xs text-[#a1a1a6] underline hover:text-[#f5f5f7]"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                  {coverLetterResult.key_selling_points_used?.length > 0 && (
                    <div className="border-t border-white/[0.08] pt-4">
                      <p className="mb-2 text-xs font-semibold text-[#a1a1a6]">Angles used</p>
                      <div className="flex flex-wrap gap-1.5">
                        {coverLetterResult.key_selling_points_used.map((p, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300/90"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <CoverLetterPdfButton text={editedCoverLetter} jobTitle={jobTitle} company={company} candidateName={candidateName} />
                </div>
              )}

              {activeTab === "followup" && followUpEmails.length > 0 && (
                <div className="space-y-6">
                  {followUpEmails.map((email, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-white/[0.1] bg-black/30 px-2.5 py-0.5 text-xs font-medium text-[#a1a1a6]">
                            {email.type}
                          </span>
                          <span className="text-sm font-semibold text-[#f5f5f7]">{email.subject}</span>
                        </div>
                        <CopyButton text={`Subject: ${email.subject}\n\n${email.body}`} />
                      </div>
                      {email.when_to_send && (
                        <p className="text-xs font-medium text-[#86868b]">Send: {email.when_to_send}</p>
                      )}
                      <p className="whitespace-pre-wrap pl-1 text-sm leading-relaxed text-[#a1a1a6]">{email.body}</p>
                      {i < followUpEmails.length - 1 && <hr className="border-white/[0.08]" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showAuthPrompt && (
              <div className="rounded-xl border border-[#2997ff]/25 bg-[#2997ff]/[0.06] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-[#f5f5f7]">Create a free account to save your work</p>
                    <p className="text-xs leading-relaxed text-[#a1a1a6]">
                      Your results are ready — sign up to save them to your archive and track applications.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAuthPrompt(false)}
                    className="shrink-0 text-[#a1a1a6] hover:text-[#f5f5f7]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/signup?redirect=/resume" className="btn-primary py-2.5 text-sm">
                    Sign up free
                  </Link>
                  <Link href="/login?redirect=/resume" className="btn-ghost-apple py-2.5 text-sm">
                    Sign in
                  </Link>
                </div>
              </div>
            )}

            {!getToken() && !showAuthPrompt && (
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <p className="flex-1 text-xs text-[#a1a1a6]">
                  Want to save and track this?{" "}
                  <Link href="/signup?redirect=/resume" className="text-[#2997ff] hover:underline">Sign up free</Link>
                </p>
              </div>
            )}

            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Spinner className="h-4 w-4" /> : null}
              {saving ? "Saving…" : "Save to archive"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
