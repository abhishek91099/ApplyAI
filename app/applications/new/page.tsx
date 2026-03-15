"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Spinner } from "@/components/Spinner";
import { CopyButton } from "@/components/CopyButton";
import { ATSScore } from "@/components/ATSScore";
import { InterviewPrepView } from "@/components/InterviewPrepView";
import { CoverLetterPdfButton } from "@/components/CoverLetterPdfButton";
import { DiffView } from "@/components/DiffView";
import {
  tailorResume, scoreResume, generateCoverLetter, generateFollowUps,
  getInterviewPrep, saveApplication, extractPdf, extractUrl, extractCandidateInfo,
} from "@/lib/api";
import { normalizePrepError } from "@/lib/utils";
import type { TailorResult, ScoreResult, CoverLetterResult, FollowUpEmail, InterviewPrep } from "@/lib/types";

const INPUT_CLASS =
  "block w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all";

const TAB_CONFIG = [
  { key: "resume" as const, label: "Resume", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
  { key: "cover" as const, label: "Cover Letter", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
  { key: "followup" as const, label: "Emails", icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" },
  { key: "prep" as const, label: "Prep", icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" },
];

export default function NewApplicationPage() {
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
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrep | null>(null);

  const [editedResume, setEditedResume] = useState("");
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const [resumeView, setResumeView] = useState<"after" | "compare">("after");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractingInfo, setExtractingInfo] = useState(false);
  const [infoAutoFilled, setInfoAutoFilled] = useState(false);
  const [error, setError] = useState("");
  const [prepError, setPrepError] = useState("");
  const [activeTab, setActiveTab] = useState<"resume" | "cover" | "followup" | "prep">("resume");
  const [preparingInterview, setPreparingInterview] = useState(false);
  const extractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasResults = tailorResult || scoreResult || coverLetterResult || followUpEmails.length > 0 || interviewPrep;
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
      } catch { /* silent — user can fill manually */ }
      finally { setExtractingInfo(false); }
    }, 600);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true); setError("");
    try {
      const text = await extractPdf(file);
      setResumeText(text);
      autoExtractInfo(text);
    }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "PDF extraction failed"); }
    finally { setExtracting(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleGenerate = async () => {
    setError(""); setGenerating(true);
    setTailorResult(null); setScoreResult(null); setCoverLetterResult(null); setFollowUpEmails([]);
    try {
      const [tailor, score, cover, followups] = await Promise.all([
        tailorResume(resumeText, jobDescription, experienceYears, currentRole, jobTitle, isCareerChange),
        scoreResume(resumeText, jobDescription),
        generateCoverLetter(resumeText, jobDescription, company, candidateName, experienceYears, currentRole, jobTitle, isCareerChange),
        generateFollowUps(jobTitle, company, candidateName),
      ]);
      setTailorResult(tailor); setEditedResume(tailor.tailored_resume);
      setScoreResult(score); setCoverLetterResult(cover); setEditedCoverLetter(cover.cover_letter);
      setFollowUpEmails(followups.emails); setActiveTab("resume");
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Generation failed"); }
    finally { setGenerating(false); }
  };

  const runInterviewPrep = async () => {
    setPrepError("");
    setPreparingInterview(true);
    try {
      const prep = await getInterviewPrep(jobTitle, company, jobDescription, experienceYears);
      setInterviewPrep(prep);
      setActiveTab("prep");
    } catch (err: unknown) {
      setPrepError(normalizePrepError(err));
    } finally {
      setPreparingInterview(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const app = await saveApplication({
        job_title: jobTitle, company, job_description: jobDescription,
        candidate_name: candidateName || null, experience_years: experienceYears || null,
        current_role: currentRole || null, is_career_change: isCareerChange,
        original_resume: resumeText,
        tailored_resume: editedResume || tailorResult?.tailored_resume || null,
        resume_meta: tailorResult ? { changes_made: tailorResult.changes_made, keywords_added: tailorResult.keywords_added } : null,
        ats_score: scoreResult?.ats_score || null,
        score_details: scoreResult ? { score_breakdown: scoreResult.score_breakdown, critical_issues: scoreResult.critical_issues, quick_wins: scoreResult.quick_wins } : null,
        keywords: scoreResult?.matched_keywords || [], missing_keywords: scoreResult?.missing_keywords || [],
        cover_letter: editedCoverLetter || coverLetterResult?.cover_letter || null,
        cover_letter_meta: coverLetterResult ? { tone_used: coverLetterResult.tone_used, key_selling_points_used: coverLetterResult.key_selling_points_used } : null,
        follow_up_emails: followUpEmails, interview_prep: interviewPrep, status: "Applied",
      });
      router.push(`/applications/${app.id}`);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Save failed"); setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <div className="mx-auto max-w-4xl min-w-0 px-3 py-6 space-y-6 sm:px-4 sm:py-8 sm:space-y-8">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">New Application</h1>
          <p className="mt-1 text-sm text-zinc-500">Fill in the details and generate AI-optimized content</p>
        </div>

        {/* Input */}
        <div className="rounded-2xl border border-white/[0.06] bg-surface p-6 sm:p-8 space-y-6">
          {/* Target Job */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-4">Target Job</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Role <span className="text-red-400">*</span></label>
                <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Company <span className="text-red-400">*</span></label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" className={INPUT_CLASS} />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.04]" />

          {/* About You — auto-detected from resume */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-violet-400">About You</h2>
              {extractingInfo && (
                <span className="inline-flex items-center gap-1.5 text-xs text-violet-400/80 animate-pulse">
                  <Spinner className="h-3 w-3" /> Reading from resume...
                </span>
              )}
              {infoAutoFilled && !extractingInfo && (
                <span className="text-xs text-emerald-400/80">Auto-filled from resume</span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Your Name</label>
                <input type="text" value={candidateName} onChange={(e) => { setCandidateName(e.target.value); setInfoAutoFilled(false); }} placeholder="Auto-detected from resume" className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Experience (years)</label>
                <input type="text" inputMode="numeric" value={experienceYears || ""} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setExperienceYears(v ? parseInt(v) : 0); setInfoAutoFilled(false); }} placeholder="Auto-detected" className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Current Role</label>
                <input type="text" value={currentRole} onChange={(e) => { setCurrentRole(e.target.value); setInfoAutoFilled(false); }} placeholder="Auto-detected from resume" className={INPUT_CLASS} />
              </div>
            </div>
            <label className="inline-flex items-center gap-2.5 cursor-pointer mt-4 group">
              <input type="checkbox" checked={isCareerChange} onChange={(e) => setIsCareerChange(e.target.checked)} className="h-4 w-4 rounded border-zinc-600 bg-surface text-indigo-500 focus:ring-indigo-500/30 transition" />
              <span className="text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">This is a career change</span>
            </label>
          </div>

          <div className="border-t border-white/[0.04]" />

          {/* Resume */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Resume <span className="text-red-400">*</span></h2>
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 transition-all">
                {extracting ? <><Spinner className="h-3 w-3" /> Extracting...</> : (
                  <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>Upload PDF</>
                )}
                <input ref={fileRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              </label>
            </div>
            <textarea rows={8} value={resumeText} onChange={(e) => setResumeText(e.target.value)} onPaste={(e) => { const pasted = e.clipboardData.getData("text"); if (pasted.length > 50) setTimeout(() => autoExtractInfo(pasted), 100); }} placeholder="Paste your resume text here, or upload a PDF..." className={INPUT_CLASS} />
          </div>

          <div className="border-t border-white/[0.04]" />

          {/* Job Description */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">Job Description <span className="text-red-400">*</span></h2>
            <div className="flex gap-2 mb-3">
              <input type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="Paste job URL to auto-extract..." className="flex-1 rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all" />
              <button type="button" onClick={async () => { if (!jobUrl.trim()) return; setExtractingUrl(true); setError(""); try { setJobDescription(await extractUrl(jobUrl.trim())); } catch (err: unknown) { setError(err instanceof Error ? err.message : "URL extraction failed"); } finally { setExtractingUrl(false); } }} disabled={!jobUrl.trim() || extractingUrl} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2.5 text-sm font-medium text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0">
                {extractingUrl ? <><Spinner className="h-3.5 w-3.5" /> Extracting...</> : "Extract"}
              </button>
            </div>
            <textarea rows={8} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." className={INPUT_CLASS} />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={handleGenerate} disabled={!canGenerate || generating} className="inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none transition-all">
              {generating && <Spinner className="h-4 w-4" />}
              {generating ? "Generating..." : "Analyze & Generate"}
            </button>
            <button onClick={runInterviewPrep} disabled={!canGenerate || preparingInterview} className="inline-flex items-center gap-2 rounded-xl bg-gradient-warm px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:shadow-none transition-all">
              {preparingInterview && <Spinner className="h-4 w-4" />}
              {preparingInterview ? "Preparing..." : "Deep Prep for Interview"}
            </button>
          </div>
          {prepError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex flex-wrap items-center justify-center gap-2 mt-2">
              <span>{prepError}</span>
              <button onClick={() => { setPrepError(""); runInterviewPrep(); }} disabled={preparingInterview} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50 transition-all">
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="space-y-6">
            {scoreResult && (
              <div className="rounded-2xl border border-white/[0.06] bg-surface p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center gap-5">
                  <ATSScore score={scoreResult.ats_score} />
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(scoreResult.score_breakdown).map(([key, val]) => (
                      <div key={key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                        <p className="text-lg font-bold text-white">{val}<span className="text-xs text-zinc-600">%</span></p>
                        <p className="text-xs text-zinc-500 capitalize">{key.replace("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {scoreResult.matched_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {scoreResult.matched_keywords.map((k) => <span key={k} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">{k}</span>)}
                  </div>
                )}
                {scoreResult.missing_keywords.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">Missing keywords:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {scoreResult.missing_keywords.map((k) => <span key={k} className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">{k}</span>)}
                    </div>
                  </div>
                )}
                {scoreResult.critical_issues.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-1.5">Critical issues:</p>
                    <ul className="space-y-1">{scoreResult.critical_issues.map((issue, i) => <li key={i} className="text-xs text-red-400/80 flex gap-2"><span className="shrink-0">!</span> {issue}</li>)}</ul>
                  </div>
                )}
                {scoreResult.quick_wins.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 mb-1.5">Quick wins:</p>
                    <ul className="space-y-1">{scoreResult.quick_wins.map((win, i) => <li key={i} className="text-xs text-emerald-400/80 flex gap-2"><span className="shrink-0">+</span> {win}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-white/[0.06] -mx-3 sm:mx-0">
              <nav className="flex flex-nowrap gap-1 overflow-x-auto px-3 sm:px-0">
                {TAB_CONFIG.map(({ key, label, icon }) => {
                  const has = key === "resume" ? !!tailorResult : key === "cover" ? !!coverLetterResult : key === "followup" ? followUpEmails.length > 0 : !!interviewPrep;
                  return (
                    <button key={key} onClick={() => setActiveTab(key)} disabled={!has}
                      className={`inline-flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all ${activeTab === key ? "border-indigo-500 text-indigo-400" : has ? "border-transparent text-zinc-500 hover:text-zinc-300" : "border-transparent text-zinc-700 cursor-not-allowed"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="rounded-2xl border border-white/[0.06] bg-surface p-6 sm:p-8">
              {activeTab === "resume" && tailorResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-zinc-200">Tailored Resume</h3>
                      <div className="flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5">
                        <button onClick={() => setResumeView("after")} className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${resumeView === "after" ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Edit</button>
                        <button onClick={() => setResumeView("compare")} className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${resumeView === "compare" ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Before / After</button>
                      </div>
                    </div>
                    <CopyButton text={editedResume} />
                  </div>
                  {resumeView === "after" && (
                    <div className="space-y-2">
                      <textarea value={editedResume} onChange={(e) => setEditedResume(e.target.value)} rows={20} className="block w-full rounded-xl border border-white/[0.08] bg-elevated px-4 py-3 text-sm font-mono leading-relaxed text-zinc-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all" />
                      {editedResume !== tailorResult.tailored_resume && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-amber-400 font-medium">Unsaved edits</span>
                          <button onClick={() => setEditedResume(tailorResult.tailored_resume)} className="text-xs text-zinc-500 underline hover:text-zinc-300">Reset</button>
                        </div>
                      )}
                    </div>
                  )}
                  {resumeView === "compare" && (
                    <DiffView before={resumeText} after={editedResume} />
                  )}
                  {tailorResult.changes_made?.length > 0 && (
                    <div className="border-t border-white/[0.04] pt-4">
                      <p className="text-xs font-semibold text-zinc-500 mb-2">Changes made:</p>
                      <ul className="space-y-1">{tailorResult.changes_made.map((c, i) => <li key={i} className="text-xs text-zinc-400 flex gap-2"><span className="text-indigo-400 shrink-0">-</span> {c}</li>)}</ul>
                    </div>
                  )}
                  {tailorResult.keywords_added?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 mb-2">Keywords added:</p>
                      <div className="flex flex-wrap gap-1.5">{tailorResult.keywords_added.map((k) => <span key={k} className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400">{k}</span>)}</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "cover" && coverLetterResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-200">Cover Letter</h3>
                      {coverLetterResult.tone_used && <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-400">{coverLetterResult.tone_used}</span>}
                    </div>
                    <CopyButton text={editedCoverLetter} />
                  </div>
                  <textarea value={editedCoverLetter} onChange={(e) => setEditedCoverLetter(e.target.value)} rows={14} className="block w-full rounded-xl border border-white/[0.08] bg-elevated px-4 py-3 text-sm leading-relaxed text-zinc-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all" />
                  {editedCoverLetter !== coverLetterResult.cover_letter && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400 font-medium">Unsaved edits</span>
                      <button onClick={() => setEditedCoverLetter(coverLetterResult.cover_letter)} className="text-xs text-zinc-500 underline hover:text-zinc-300">Reset</button>
                    </div>
                  )}
                  {coverLetterResult.key_selling_points_used?.length > 0 && (
                    <div className="border-t border-white/[0.04] pt-4">
                      <p className="text-xs font-semibold text-zinc-500 mb-2">Key selling points:</p>
                      <div className="flex flex-wrap gap-1.5">{coverLetterResult.key_selling_points_used.map((p, i) => <span key={i} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">{p}</span>)}</div>
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
                          <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-zinc-400">{email.type}</span>
                          <span className="text-sm font-semibold text-zinc-200">{email.subject}</span>
                        </div>
                        <CopyButton text={`Subject: ${email.subject}\n\n${email.body}`} />
                      </div>
                      {email.when_to_send && <p className="text-xs text-indigo-400 font-medium">Send: {email.when_to_send}</p>}
                      <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap pl-1">{email.body}</p>
                      {i < followUpEmails.length - 1 && <hr className="border-white/[0.04]" />}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "prep" && interviewPrep && <InterviewPrepView prep={interviewPrep} />}
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-success px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all">
              {saving ? <Spinner className="h-4 w-4" /> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>}
              {saving ? "Saving..." : "Save Application"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
