"use client";

async function exportCoverLetterPdf(text: string, jobTitle: string, company: string, candidateName?: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxW = pw - margin * 2;
  let y = 24;

  const checkPage = (need: number) => {
    if (y + need > 278) { doc.addPage(); y = 20; }
  };

  if (candidateName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(candidateName, margin, y);
    y += 8;
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(today, margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Re: ${jobTitle} at ${company}`, margin, y);
  y += 8;

  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  const paragraphs = text.split(/\n\n+/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const isSalutation = /^(dear|hi|hello|to whom)/i.test(trimmed);
    const isClosing = /^(sincerely|regards|best|cheers|thank|warm)/i.test(trimmed) && trimmed.length < 80;

    if (isClosing) {
      y += 2;
    }

    doc.setFont("helvetica", isSalutation || isClosing ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(trimmed, maxW);
    for (const line of lines) {
      checkPage(5);
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 3;
  }

  const filename = `CoverLetter-${jobTitle}-${company}`
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 60);
  doc.save(`${filename}.pdf`);
}

export function CoverLetterPdfButton({
  text,
  jobTitle,
  company,
  candidateName,
}: {
  text: string;
  jobTitle: string;
  company: string;
  candidateName?: string;
}) {
  return (
    <button
      onClick={() => exportCoverLetterPdf(text, jobTitle, company, candidateName)}
      className="inline-flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-400 hover:bg-violet-500/20 transition-all"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
      </svg>
      Download Cover Letter PDF
    </button>
  );
}
