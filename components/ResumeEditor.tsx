"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { Spinner } from "./Spinner";
import { DiffView } from "./DiffView";
import { updateApplication } from "@/lib/api";

interface ResumeEditorProps {
  applicationId: string;
  initialText: string;
  originalResume?: string | null;
  jobTitle: string;
  company: string;
  onSave: (text: string) => void;
}

type RGB = [number, number, number];

const THEME = {
  black: [33, 33, 33] as RGB,
  dark: [55, 55, 55] as RGB,
  body: [60, 60, 60] as RGB,
  muted: [110, 110, 110] as RGB,
  accent: [37, 99, 235] as RGB,
  rule: [37, 99, 235] as RGB,
  ruleLight: [200, 210, 230] as RGB,
};

const FONT = { body: 9.5, bullet: 9.2, heading: 10.5, sub: 9.5, name: 16, contact: 8.5 };
const LINE_H = 4.2;
const BULLET_INDENT = 5;

interface ParsedLine {
  type: "name" | "contact" | "heading" | "subheading" | "bullet" | "body" | "blank";
  text: string;
}

function clean(s: string): string {
  return s.replace(/\*\*/g, "").replace(/\(cid:\d+\)/g, "").replace(/[§]/g, "").trim();
}

function parseResumeLines(raw: string): ParsedLine[] {
  const src = raw.split("\n");
  const out: ParsedLine[] = [];
  let nameFound = false;
  let contactFound = false;

  for (let i = 0; i < src.length; i++) {
    const trimmed = src[i].trim();
    if (!trimmed) { out.push({ type: "blank", text: "" }); continue; }

    if (!nameFound) {
      nameFound = true;
      out.push({ type: "name", text: clean(trimmed).replace(/^#+\s*/, "") });
      continue;
    }

    if (!contactFound && nameFound && out.length <= 3) {
      const looksContact = /[@|]/.test(trimmed) || /\d{3}/.test(trimmed) || /linkedin|github|\.com/i.test(trimmed);
      if (looksContact) {
        contactFound = true;
        const contactText = clean(trimmed).replace(/\s{2,}/g, "  |  ");
        out.push({ type: "contact", text: contactText });
        continue;
      }
    }

    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length < 60 && trimmed.length > 1;
    const isMdHeading = /^#{1,3}\s/.test(trimmed);
    const isKnownSection = /^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS|AWARDS|CONTACT|REFERENCES|PROFESSIONAL|WORK HISTORY|TECHNICAL|LANGUAGES|INTERESTS|VOLUNTEER|PUBLICATIONS|PROFILE)/i.test(trimmed);

    if (isAllCaps || isMdHeading || isKnownSection) {
      out.push({ type: "heading", text: clean(trimmed).replace(/^#+\s*/, "").toUpperCase() });
      continue;
    }

    if (/^\s*[-•●◦▪*]\s/.test(trimmed) || /^\s*\d+[.)]\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^\s*[-•●◦▪*]\s*/, "").replace(/^\s*\d+[.)]\s*/, "");
      out.push({ type: "bullet", text: clean(bulletText) });
      continue;
    }

    const hasDateRange = /\b\d{4}\b/.test(trimmed) || /present|current/i.test(trimmed);
    const hasSeparator = /\s+[|–—-]\s+/.test(trimmed);
    const nextLine = i + 1 < src.length ? src[i + 1].trim() : "";
    const nextIsBullet = /^\s*[-•●◦▪*]\s/.test(nextLine) || /^\s*\d+[.)]\s/.test(nextLine);

    if ((hasSeparator && (hasDateRange || nextIsBullet)) || (trimmed.length < 100 && nextIsBullet)) {
      out.push({ type: "subheading", text: clean(trimmed) });
      continue;
    }

    out.push({ type: "body", text: clean(trimmed) });
  }

  return out;
}

async function exportResumePdf(text: string, jobTitle: string, company: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const marginTop = 14;
  const marginBot = 14;
  const contentW = pw - marginX * 2;
  let y = marginTop;

  const checkPage = (need: number) => {
    if (y + need > ph - marginBot) { doc.addPage(); y = marginTop; }
  };

  const parsed = parseResumeLines(text);

  for (let i = 0; i < parsed.length; i++) {
    const line = parsed[i];

    switch (line.type) {
      case "name": {
        checkPage(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT.name);
        doc.setTextColor(...THEME.black);
        doc.text(line.text, pw / 2, y, { align: "center" });
        y += 6;
        break;
      }

      case "contact": {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FONT.contact);
        doc.setTextColor(...THEME.muted);
        doc.text(line.text, pw / 2, y, { align: "center" });
        y += 4.5;
        doc.setDrawColor(...THEME.rule);
        doc.setLineWidth(0.6);
        doc.line(marginX, y, pw - marginX, y);
        y += 5;
        break;
      }

      case "heading": {
        checkPage(10);
        if (i > 0) y += 3;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT.heading);
        doc.setTextColor(...THEME.accent);
        doc.text(line.text, marginX, y);
        y += 1.2;
        doc.setDrawColor(...THEME.ruleLight);
        doc.setLineWidth(0.25);
        doc.line(marginX, y, pw - marginX, y);
        y += 3.5;
        break;
      }

      case "subheading": {
        checkPage(8);
        y += 1;

        const parts = line.text.split(/\s+[|–—]\s+/);
        if (parts.length >= 2) {
          const left = parts.slice(0, -1).join(" | ");
          const right = parts[parts.length - 1];

          doc.setFont("helvetica", "bold");
          doc.setFontSize(FONT.sub);
          doc.setTextColor(...THEME.dark);
          doc.text(left, marginX, y);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(FONT.sub - 0.5);
          doc.setTextColor(...THEME.muted);
          doc.text(right, pw - marginX, y, { align: "right" });
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(FONT.sub);
          doc.setTextColor(...THEME.dark);
          const wrapped = doc.splitTextToSize(line.text, contentW);
          for (const wl of wrapped) {
            checkPage(LINE_H);
            doc.text(wl, marginX, y);
            y += LINE_H;
          }
          y -= LINE_H;
        }
        y += LINE_H + 0.3;
        break;
      }

      case "bullet": {
        checkPage(LINE_H);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FONT.bullet);
        doc.setTextColor(...THEME.body);

        const bulletX = marginX + 2;
        const textX = marginX + BULLET_INDENT;
        const wrapped = doc.splitTextToSize(line.text, contentW - BULLET_INDENT);

        doc.setTextColor(...THEME.accent);
        doc.text("•", bulletX, y);
        doc.setTextColor(...THEME.body);

        for (let j = 0; j < wrapped.length; j++) {
          checkPage(LINE_H);
          doc.text(wrapped[j], textX, y);
          y += LINE_H;
        }
        y += 0.3;
        break;
      }

      case "body": {
        checkPage(LINE_H);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FONT.body);
        doc.setTextColor(...THEME.body);
        const wrapped = doc.splitTextToSize(line.text, contentW);
        for (const wl of wrapped) {
          checkPage(LINE_H);
          doc.text(wl, marginX, y);
          y += LINE_H;
        }
        y += 0.3;
        break;
      }

      case "blank": {
        y += 1.8;
        break;
      }
    }
  }

  const filename = `Resume-${jobTitle}-${company}`
    .replace(/[^a-zA-Z0-9\-_ ]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 60);
  doc.save(`${filename}.pdf`);
}

export function ResumeEditor({ applicationId, initialText, originalResume, jobTitle, company, onSave }: ResumeEditorProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const [savedText, setSavedText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"view" | "compare">("view");

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateApplication(applicationId, { tailored_resume: text });
      setSavedText(text); onSave(text); setEditing(false);
    } catch { /* keep editing */ } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">Tailored Resume</h3>
          {originalResume && !editing && (
            <div className="flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5">
              <button onClick={() => setView("view")} className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${view === "view" ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}>View</button>
              <button onClick={() => setView("compare")} className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${view === "compare" ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Before / After</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!editing && <CopyButton text={text} />}
          {!editing && (
            <button onClick={() => { setEditing(true); setView("view"); }} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={20} className="block w-full rounded-xl border border-white/[0.08] bg-surface px-4 py-3 text-sm font-mono text-zinc-200 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all" />
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-accent px-4 py-2 text-sm font-semibold text-white shadow-glow-brand disabled:opacity-50 transition-all">
              {saving && <Spinner className="h-3.5 w-3.5" />} Save Changes
            </button>
            <button onClick={() => { setText(savedText); setEditing(false); }} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/[0.04] transition-all">Cancel</button>
          </div>
        </div>
      ) : view === "compare" && originalResume ? (
        <div className="space-y-4">
          <DiffView before={originalResume} after={text} />
          <DownloadResumeButton text={text} jobTitle={jobTitle} company={company} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{text}</div>
          <DownloadResumeButton text={text} jobTitle={jobTitle} company={company} />
        </div>
      )}
    </div>
  );
}

function DownloadResumeButton({ text, jobTitle, company }: { text: string; jobTitle: string; company: string }) {
  return (
    <button
      onClick={() => exportResumePdf(text, jobTitle, company)}
      className="inline-flex items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-2.5 text-sm font-semibold text-brand-400 hover:bg-brand-500/20 transition-all"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
      </svg>
      Download Resume PDF
    </button>
  );
}
