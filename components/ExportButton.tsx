"use client";

import { useState } from "react";
import type { Application } from "@/lib/types";

function buildTextContent(app: Application): string {
  const lines: string[] = [];
  const divider = "=".repeat(60);
  lines.push(divider);
  lines.push(`APPLICATION: ${app.job_title} at ${app.company}`);
  lines.push(`Status: ${app.status}`);
  if (app.ats_score != null) lines.push(`ATS Score: ${app.ats_score}/100`);
  lines.push(`Date: ${new Date(app.created_at).toLocaleDateString()}`);
  lines.push(divider);
  if (app.keywords?.length) lines.push("\nMATCHED KEYWORDS: " + app.keywords.join(", "));
  if (app.missing_keywords?.length) lines.push("MISSING KEYWORDS: " + app.missing_keywords.join(", "));
  if (app.tailored_resume) { lines.push(`\n${divider}`); lines.push("TAILORED RESUME"); lines.push(divider); lines.push(app.tailored_resume); }
  if (app.cover_letter) { lines.push(`\n${divider}`); lines.push("COVER LETTER"); lines.push(divider); lines.push(app.cover_letter); }
  if (app.follow_up_emails?.length) {
    lines.push(`\n${divider}`); lines.push("FOLLOW-UP EMAILS"); lines.push(divider);
    app.follow_up_emails.forEach((email, i) => { lines.push(`\n--- ${i + 1}. ${email.type.toUpperCase()} ---`); lines.push(`Subject: ${email.subject}`); lines.push(`\n${email.body}`); });
  }
  return lines.join("\n");
}

function downloadFile(content: string | Blob, filename: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(app: Application): string {
  return `${app.job_title}-${app.company}`.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "_").substring(0, 60);
}

async function exportAsPdf(app: Application) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (text: string, size: number, style: "normal" | "bold" = "normal", color: [number, number, number] = [30, 30, 30]) => {
    doc.setFontSize(size); doc.setFont("helvetica", style); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = size * 0.45;
    for (const line of lines) { if (y + lineHeight > 280) { doc.addPage(); y = 20; } doc.text(line, margin, y); y += lineHeight; }
  };
  const addGap = (gap: number) => { y += gap; };
  const addDivider = () => { if (y > 275) { doc.addPage(); y = 20; } doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageWidth - margin, y); y += 4; };

  addText(app.job_title, 18, "bold", [55, 48, 163]);
  addGap(1); addText(app.company, 12, "normal", [100, 100, 100]);
  addGap(1); addText(`Status: ${app.status}  |  Date: ${new Date(app.created_at).toLocaleDateString()}${app.ats_score != null ? `  |  ATS Score: ${app.ats_score}/100` : ""}`, 9, "normal", [130, 130, 130]);
  addGap(3);
  if (app.keywords?.length) { addText(`Keywords: ${app.keywords.join(", ")}`, 8, "normal", [22, 128, 57]); addGap(1); }
  if (app.missing_keywords?.length) { addText(`Missing: ${app.missing_keywords.join(", ")}`, 8, "normal", [185, 28, 28]); addGap(2); }

  const cleanText = (t: string) => t.replace(/\(cid:\d+\)/g, "").replace(/[§]/g, "").replace(/\*\*/g, "");
  if (app.tailored_resume) { addDivider(); addText("TAILORED RESUME", 12, "bold"); addGap(3); addText(cleanText(app.tailored_resume), 9.5); addGap(4); }
  if (app.cover_letter) { addDivider(); addText("COVER LETTER", 12, "bold"); addGap(3); addText(cleanText(app.cover_letter), 9.5); addGap(4); }
  if (app.follow_up_emails?.length) {
    addDivider(); addText("FOLLOW-UP EMAILS", 12, "bold"); addGap(3);
    app.follow_up_emails.forEach((email, i) => { addText(`${i + 1}. [${email.type}] ${email.subject}`, 10, "bold"); addGap(2); addText(email.body, 9.5); addGap(4); });
  }
  doc.save(`${sanitizeFilename(app)}.pdf`);
}

export function ExportButton({ application }: { application: Application }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
        </svg>
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/[0.08] bg-elevated py-1.5 shadow-xl shadow-black/40">
            <button
              onClick={() => { exportAsPdf(application); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.04] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-red-400">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z" clipRule="evenodd" />
              </svg>
              Export as PDF
            </button>
            <button
              onClick={() => { downloadFile(buildTextContent(application), `${sanitizeFilename(application)}.txt`); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.04] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-zinc-500">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
              </svg>
              Export as Text
            </button>
          </div>
        </>
      )}
    </div>
  );
}
