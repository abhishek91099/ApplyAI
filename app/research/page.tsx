"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Spinner } from "@/components/Spinner";
import { InterviewPrepView } from "@/components/InterviewPrepView";
import { getApplication, getInterviewPrep, updateApplication } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { normalizePrepError } from "@/lib/utils";
import type { InterviewPrep } from "@/lib/types";

function ResearchContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId")?.trim() || "";

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const isLoggedIn = !!getToken();
  const canLoadApp = !!applicationId && isLoggedIn;
  const [loadingApp, setLoadingApp] = useState(canLoadApp);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [prep, setPrep] = useState<InterviewPrep | null>(null);

  useEffect(() => {
    if (!applicationId || !isLoggedIn) {
      setLoadingApp(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const app = await getApplication(applicationId);
        if (cancelled) return;
        setJobTitle(app.job_title);
        setCompany(app.company);
        setJobDescription(app.job_description);
        setExperienceYears(app.experience_years ?? 0);
        if (app.interview_prep) setPrep(app.interview_prep);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load application");
      } finally {
        if (!cancelled) setLoadingApp(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId, isLoggedIn]);

  const canRun = jobTitle.trim() && company.trim() && jobDescription.trim();

  const run = async () => {
    setError("");
    setGenerating(true);
    try {
      const next = await getInterviewPrep(jobTitle, company, jobDescription, experienceYears);
      setPrep(next);
    } catch (err: unknown) {
      setError(normalizePrepError(err));
    } finally {
      setGenerating(false);
    }
  };

  const saveToRole = async () => {
    if (!applicationId || !prep) return;
    setSaving(true);
    setError("");
    try {
      await updateApplication(applicationId, { interview_prep: prep });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loadingApp) {
    return (
      <div className="flex justify-center py-28">
        <Spinner className="h-9 w-9 text-[#2997ff]" />
      </div>
    );
  }

  return (
    <>
      <div className="relative space-y-4">
        <div className="h-px w-24 bg-gradient-to-r from-[#2997ff]/45 to-transparent" />
        <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-[#86868b]">Intelligence</p>
        <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#f5f5f7] sm:text-[40px]">
          Deep prep for the role you&apos;re chasing
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[#a1a1a6]">
          Role-specific questions, narratives, and angles — separate from your résumé workflow.{" "}
          <Link href="/resume" className="text-[#2997ff] underline decoration-[#2997ff]/35 underline-offset-4 hover:decoration-[#2997ff]/60">
            Résumé studio
          </Link>
        </p>
      </div>

      <div className="apple-panel space-y-6 p-6 sm:p-9">
        {applicationId && isLoggedIn && (
          <p className="text-xs text-[#2997ff]">
            Linked to saved application — generate below, then attach to that record.
          </p>
        )}
        {applicationId && !isLoggedIn && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs text-amber-300/90">
            Sign in to load and save to your application.{" "}
            <Link href={`/login?redirect=/research?applicationId=${applicationId}`} className="text-[#2997ff] hover:underline">Sign in</Link>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-[#a1a1a6]">Role</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="input-modern"
              placeholder="Title on the posting"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[#a1a1a6]">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input-modern"
              placeholder="Organization"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-[#a1a1a6]">Years of experience (context)</label>
          <input
            type="text"
            inputMode="numeric"
            value={experienceYears || ""}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              setExperienceYears(v ? parseInt(v, 10) : 0);
            }}
            className="input-modern max-w-[200px]"
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-[#a1a1a6]">Job description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={10}
            className="input-modern min-h-[200px] resize-y"
            placeholder="Paste the full description or key requirements…"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={run} disabled={!canRun || generating} className="btn-primary">
            {generating && <Spinner className="h-4 w-4" />}
            {generating ? "Synthesizing…" : "Generate intelligence"}
          </button>
          {applicationId && isLoggedIn && prep && (
            <button type="button" onClick={saveToRole} disabled={saving} className="btn-ghost-apple">
              {saving ? <Spinner className="h-4 w-4" /> : null}
              {saving ? "Saving…" : "Save to this application"}
            </button>
          )}
        </div>
        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-950/40 p-3 text-sm text-red-300/95">{error}</div>
        )}
        {!isLoggedIn && prep && (
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
            <p className="flex-1 text-xs text-[#a1a1a6]">
              Save intelligence to your applications.{" "}
              <Link href="/signup?redirect=/research" className="text-[#2997ff] hover:underline">Sign up free</Link>
            </p>
          </div>
        )}
      </div>

      {prep && (
        <div className="apple-panel overflow-hidden p-0">
          <div className="border-b border-white/[0.08] px-6 py-4 sm:px-8">
            <h2 className="text-[21px] font-semibold text-[#f5f5f7]">Dossier</h2>
            <p className="text-xs text-[#a1a1a6]">Refine your story before the conversation.</p>
          </div>
          <div className="p-6 sm:p-8">
            <InterviewPrepView prep={prep} />
          </div>
        </div>
      )}
    </>
  );
}

function ResearchFallback() {
  return (
    <div className="flex justify-center py-28">
      <Spinner className="h-9 w-9 text-[#2997ff]" />
    </div>
  );
}

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-black text-[#f5f5f7]">
      <Navbar />
      <div className="mx-auto max-w-[1024px] min-w-0 space-y-10 px-6 py-10 md:py-14">
        <Suspense fallback={<ResearchFallback />}>
          <ResearchContent />
        </Suspense>
      </div>
    </div>
  );
}
