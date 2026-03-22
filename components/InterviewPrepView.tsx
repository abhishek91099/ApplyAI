"use client";

import { useState } from "react";
import type { InterviewPrep } from "@/lib/types";
import { CopyButton } from "@/components/CopyButton";

const SECTION_TABS = ["process", "resources", "experiences", "topics", "questions"] as const;
type SectionTab = (typeof SECTION_TABS)[number];

const TAB_LABELS: Record<SectionTab, string> = {
  process: "Interview Process",
  resources: "Resources & Links",
  experiences: "Experiences & Salary",
  topics: "Topics to Study",
  questions: "Questions",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  hard: "bg-red-500/10 text-red-400 border-red-500/20",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const RESOURCE_COLORS: Record<string, string> = {
  glassdoor: "bg-green-500/10 text-green-400 border-green-500/20",
  leetcode: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  youtube: "bg-red-500/10 text-red-400 border-red-500/20",
  blog: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  book: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  course: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  tool: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  platform: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  practice: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function prepToText(prep: InterviewPrep): string {
  const lines: string[] = [];
  lines.push("=== INTERVIEW PREPARATION GUIDE ===\n");

  lines.push("## Interview Process");
  prep.interview_process.forEach((r) => {
    lines.push(`- ${r.round} (${r.duration})${r.interviewer ? ` — ${r.interviewer}` : ""}`);
    lines.push(`  ${r.description}`);
    if (r.how_to_prepare) lines.push(`  Prepare: ${r.how_to_prepare}`);
  });

  lines.push("\n## Resources");
  prep.resources.forEach((r) => {
    lines.push(`- [${r.type}] ${r.title}`);
    if (r.url) lines.push(`  ${r.url}`);
    if (r.why_helpful) lines.push(`  ${r.why_helpful}`);
  });

  if (prep.interview_experiences) {
    const exp = prep.interview_experiences;
    lines.push("\n## Interview Experiences & Salary");
    if (exp.difficulty_description) lines.push(`Difficulty: ${exp.difficulty_rating ?? "?"}/5 — ${exp.difficulty_description}`);
    if (exp.salary_range) lines.push(`Salary Range: ${exp.salary_range}`);
    if (exp.offer_timeline) lines.push(`Offer Timeline: ${exp.offer_timeline}`);
    if (exp.common_themes?.length) { lines.push("Common themes:"); exp.common_themes.forEach((t) => lines.push(`  - ${t}`)); }
    if (exp.standout_tips?.length) { lines.push("How to stand out:"); exp.standout_tips.forEach((t) => lines.push(`  - ${t}`)); }
    if (exp.levels_fyi_url) lines.push(`Levels.fyi: ${exp.levels_fyi_url}`);
    if (exp.glassdoor_url) lines.push(`Glassdoor: ${exp.glassdoor_url}`);
  }

  lines.push("\n## Key Topics to Study");
  prep.key_topics.forEach((t) => {
    if (typeof t === "string") { lines.push(`- ${t}`); return; }
    lines.push(`- [${t.priority}] ${t.topic}`);
    if (t.what_to_study) lines.push(`  Study: ${t.what_to_study}`);
    if (t.study_time) lines.push(`  Time: ${t.study_time}`);
  });

  lines.push("\n## Technical Questions");
  prep.technical_questions.forEach((q, i) => {
    lines.push(`${i + 1}. [${q.difficulty || "?"}] ${q.question}`);
    lines.push(`   Hint: ${q.hint}`);
  });

  lines.push("\n## Behavioral Questions");
  prep.behavioral_questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.question}`);
    lines.push(`   Hint: ${q.hint}`);
  });

  return lines.join("\n");
}

function DifficultyBar({ rating }: { rating: number }) {
  const pct = Math.min(100, (rating / 5) * 100);
  const color = rating >= 4 ? "bg-red-500" : rating >= 3 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-zinc-200">{rating}/5</span>
    </div>
  );
}

function ExternalLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors ${className}`}
    >
      {children}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0 opacity-60">
        <path d="M6.22 8.72a.75.75 0 001.06 1.06l5.22-5.22v1.69a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75h-3.5a.75.75 0 000 1.5h1.69L6.22 8.72z" />
        <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 007 4H4.75A2.75 2.75 0 002 6.75v4.5A2.75 2.75 0 004.75 14h4.5A2.75 2.75 0 0012 11.25V9a.75.75 0 00-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5z" />
      </svg>
    </a>
  );
}

export function InterviewPrepView({ prep }: { prep: InterviewPrep }) {
  const [section, setSection] = useState<SectionTab>("process");
  const [questionTab, setQuestionTab] = useState<"technical" | "behavioral">("technical");

  const hasExperiences = !!prep.interview_experiences;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Interview Preparation Guide</h3>
        <CopyButton text={prepToText(prep)} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SECTION_TABS.map((tab) => {
          if (tab === "experiences" && !hasExperiences) return null;
          return (
            <button
              key={tab}
              onClick={() => setSection(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                section === tab
                  ? "bg-brand-500/15 border border-brand-500/30 text-brand-400"
                  : "border border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {/* ── Interview Process ── */}
        {section === "process" && prep.interview_process.map((round, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-brand-500/15 text-xs font-bold text-brand-400">{i + 1}</span>
                <span className="text-sm font-semibold text-zinc-200">{round.round}</span>
                {round.is_typical && <span className="rounded-full bg-zinc-500/10 border border-zinc-500/20 px-2 py-0.5 text-[10px] text-zinc-500">typical</span>}
              </div>
              <span className="rounded-full bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 text-xs text-brand-400">{round.duration}</span>
            </div>
            {round.interviewer && (
              <p className="text-xs text-zinc-500 mb-1">Interviewer: <span className="text-zinc-400">{round.interviewer}</span></p>
            )}
            <p className="text-sm text-zinc-400">{round.description}</p>
            {round.how_to_prepare && (
              <p className="text-xs text-brand-400 bg-brand-500/10 rounded-lg px-3 py-2 mt-2">
                <span className="font-semibold">Prepare:</span> {round.how_to_prepare}
              </p>
            )}
          </div>
        ))}

        {/* ── Resources with Links ── */}
        {section === "resources" && (
          <div className="space-y-2">
            {prep.resources.map((res, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-medium mt-0.5 ${
                    RESOURCE_COLORS[res.type] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  }`}>{res.type}</span>
                  <div className="min-w-0">
                    {res.url ? (
                      <ExternalLink href={res.url} className="text-sm font-medium">
                        {res.title}
                      </ExternalLink>
                    ) : (
                      <p className="text-sm font-medium text-zinc-200">{res.title}</p>
                    )}
                    {(res.why_helpful || res.specifically_for) && (
                      <p className="text-xs text-zinc-500 mt-0.5">{res.why_helpful || res.specifically_for}</p>
                    )}
                    {res.url && (
                      <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{res.url}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Interview Experiences & Salary ── */}
        {section === "experiences" && prep.interview_experiences && (() => {
          const exp = prep.interview_experiences!;
          return (
            <div className="space-y-4">
              {/* Difficulty */}
              {exp.difficulty_rating != null && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Interview Difficulty</p>
                  <DifficultyBar rating={exp.difficulty_rating} />
                  {exp.difficulty_description && <p className="text-sm text-zinc-400">{exp.difficulty_description}</p>}
                </div>
              )}

              {/* Salary */}
              {exp.salary_range && (
                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Compensation</p>
                  <p className="text-lg font-bold text-emerald-400">{exp.salary_range}</p>
                  <div className="flex flex-wrap gap-3">
                    {exp.levels_fyi_url && <ExternalLink href={exp.levels_fyi_url} className="text-xs">Levels.fyi</ExternalLink>}
                    {exp.glassdoor_url && <ExternalLink href={exp.glassdoor_url} className="text-xs">Glassdoor Salaries</ExternalLink>}
                  </div>
                </div>
              )}

              {/* Offer timeline */}
              {exp.offer_timeline && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Offer Timeline</p>
                  <p className="text-sm text-zinc-300">{exp.offer_timeline}</p>
                </div>
              )}

              {/* Common themes */}
              {exp.common_themes && exp.common_themes.length > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">What Past Candidates Say</p>
                  <ul className="space-y-1.5">
                    {exp.common_themes.map((t, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex gap-2">
                        <span className="text-amber-500 shrink-0 mt-0.5">*</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Standout tips */}
              {exp.standout_tips && exp.standout_tips.length > 0 && (
                <div className="rounded-xl border border-brand-500/10 bg-brand-500/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-2">How to Stand Out</p>
                  <ul className="space-y-1.5">
                    {exp.standout_tips.map((t, i) => (
                      <li key={i} className="text-sm text-brand-300/80 flex gap-2">
                        <span className="text-brand-400 shrink-0 font-bold">+</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Topics to Study ── */}
        {section === "topics" && (
          <div className="space-y-2">
            {prep.key_topics.map((t, i) => {
              if (typeof t === "string") {
                return (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-sm text-zinc-300">{t}</p>
                  </div>
                );
              }
              return (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[t.priority] || ""}`}>{t.priority}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-200">{t.topic}</p>
                      {t.what_to_study && <p className="text-xs text-zinc-400 mt-1">{t.what_to_study}</p>}
                      {(t.study_time || t.reason) && (
                        <p className="text-[11px] text-zinc-600 mt-1">
                          {t.study_time && <span className="text-brand-400/70">{t.study_time}</span>}
                          {t.study_time && t.reason && " · "}
                          {t.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Questions ── */}
        {section === "questions" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setQuestionTab("technical")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  questionTab === "technical"
                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                    : "border border-white/[0.06] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Technical ({prep.technical_questions.length})
              </button>
              <button
                onClick={() => setQuestionTab("behavioral")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  questionTab === "behavioral"
                    ? "bg-violet-500/15 border border-violet-500/30 text-violet-400"
                    : "border border-white/[0.06] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Behavioral ({prep.behavioral_questions.length})
              </button>
            </div>

            {questionTab === "technical" && prep.technical_questions.map((q, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-zinc-200">{i + 1}. {q.question}</p>
                  {q.difficulty && (
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[q.difficulty] || "bg-white/[0.04] text-zinc-400 border-white/[0.08]"}`}>{q.difficulty}</span>
                  )}
                </div>
                <p className="text-xs text-brand-400 bg-brand-500/10 rounded-lg px-3 py-2 mt-2">{q.hint}</p>
                {q.why_theyre_asking && <p className="text-xs text-zinc-500 mt-1.5 italic">Tests: {q.why_theyre_asking}</p>}
              </div>
            ))}

            {questionTab === "behavioral" && prep.behavioral_questions.map((q, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-zinc-200 mb-1">{i + 1}. {q.question}</p>
                <p className="text-xs text-brand-400 bg-brand-500/10 rounded-lg px-3 py-2 mt-2">{q.hint}</p>
                {q.what_they_want_to_hear && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2 mt-1.5">Good answer: {q.what_they_want_to_hear}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
