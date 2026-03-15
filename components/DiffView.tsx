"use client";

interface DiffViewProps {
  before: string;
  after: string;
}

interface DiffLine {
  text: string;
  type: "unchanged" | "removed" | "added" | "modified";
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const wordsA = a.split(" ");
  const setB = new Set(b.split(" "));
  let matches = 0;
  for (const w of wordsA) if (setB.has(w)) matches++;
  return matches / Math.max(wordsA.length, setB.size);
}

function computeLineDiff(before: string, after: string): { beforeLines: DiffLine[]; afterLines: DiffLine[] } {
  const bRaw = before.split("\n");
  const aRaw = after.split("\n");
  const bNorm = bRaw.map(normalize);
  const aNorm = aRaw.map(normalize);

  const bStatus: DiffLine["type"][] = new Array(bRaw.length).fill("removed");
  const aStatus: DiffLine["type"][] = new Array(aRaw.length).fill("added");

  // Pass 1: exact matches (position-independent, greedy)
  // Build a map of normalized line → list of indices for the "after" side
  const afterIndexMap = new Map<string, number[]>();
  for (let j = 0; j < aNorm.length; j++) {
    const n = aNorm[j];
    if (!n) { aStatus[j] = "unchanged"; continue; }
    if (!afterIndexMap.has(n)) afterIndexMap.set(n, []);
    afterIndexMap.get(n)!.push(j);
  }

  for (let i = 0; i < bNorm.length; i++) {
    const n = bNorm[i];
    if (!n) { bStatus[i] = "unchanged"; continue; }
    const candidates = afterIndexMap.get(n);
    if (candidates && candidates.length > 0) {
      bStatus[i] = "unchanged";
      const j = candidates.shift()!;
      aStatus[j] = "unchanged";
      if (candidates.length === 0) afterIndexMap.delete(n);
    }
  }

  // Pass 2: fuzzy match remaining unmatched lines (find best pairs)
  const unmatchedB: number[] = [];
  const unmatchedA: number[] = [];
  for (let i = 0; i < bRaw.length; i++) if (bStatus[i] === "removed" && bNorm[i]) unmatchedB.push(i);
  for (let j = 0; j < aRaw.length; j++) if (aStatus[j] === "added" && aNorm[j]) unmatchedA.push(j);

  // Build similarity pairs and sort by best match
  const pairs: { i: number; j: number; sim: number }[] = [];
  for (const i of unmatchedB) {
    for (const j of unmatchedA) {
      const sim = wordSimilarity(bNorm[i], aNorm[j]);
      if (sim > 0.4) pairs.push({ i, j, sim });
    }
  }
  pairs.sort((a, b) => b.sim - a.sim);

  const matchedB = new Set<number>();
  const matchedA = new Set<number>();
  for (const { i, j } of pairs) {
    if (matchedB.has(i) || matchedA.has(j)) continue;
    bStatus[i] = "modified";
    aStatus[j] = "modified";
    matchedB.add(i);
    matchedA.add(j);
  }

  // Empty lines that weren't set yet
  for (let i = 0; i < bRaw.length; i++) if (!bNorm[i]) bStatus[i] = "unchanged";
  for (let j = 0; j < aRaw.length; j++) if (!aNorm[j]) aStatus[j] = "unchanged";

  return {
    beforeLines: bRaw.map((text, i) => ({ text, type: bStatus[i] })),
    afterLines: aRaw.map((text, j) => ({ text, type: aStatus[j] })),
  };
}

function DiffColumn({ lines, side }: { lines: DiffLine[]; side: "before" | "after" }) {
  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        const isEmpty = !line.text.trim();
        let bg = "";
        let textColor = "text-zinc-400";
        let marker = "";

        if (!isEmpty) {
          if (line.type === "removed") {
            bg = "bg-red-500/10";
            textColor = "text-red-300";
            marker = "-";
          } else if (line.type === "added") {
            bg = "bg-emerald-500/10";
            textColor = "text-emerald-300";
            marker = "+";
          } else if (line.type === "modified") {
            bg = side === "before" ? "bg-amber-500/[0.07]" : "bg-blue-500/[0.07]";
            textColor = side === "before" ? "text-amber-300/90" : "text-blue-300/90";
            marker = "~";
          }
        }

        return (
          <div key={i} className={`flex gap-2 px-3 py-0.5 ${bg}`}>
            <span className="text-[10px] text-zinc-700 w-5 shrink-0 text-right select-none font-mono leading-[1.6rem]">
              {i + 1}
            </span>
            <span className={`text-xs font-mono whitespace-pre-wrap leading-relaxed flex-1 ${textColor}`}>
              {line.text || "\u00A0"}
            </span>
            {marker && !isEmpty && (
              <span className={`text-[10px] shrink-0 font-mono leading-[1.6rem] ${
                marker === "-" ? "text-red-500/50" : marker === "+" ? "text-emerald-500/50" : "text-amber-500/50"
              }`}>{marker}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DiffView({ before, after }: DiffViewProps) {
  const { beforeLines, afterLines } = computeLineDiff(before, after);

  const removedCount = beforeLines.filter((l) => l.type === "removed").length;
  const addedCount = afterLines.filter((l) => l.type === "added").length;
  const modifiedCount = beforeLines.filter((l) => l.type === "modified").length;

  const hasChanges = removedCount > 0 || addedCount > 0 || modifiedCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs flex-wrap">
        {!hasChanges && <span className="text-zinc-500">No differences</span>}
        {removedCount > 0 && (
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500/20 border border-red-500/30" />
            <span className="font-bold">{removedCount}</span> removed
          </span>
        )}
        {addedCount > 0 && (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
            <span className="font-bold">{addedCount}</span> new
          </span>
        )}
        {modifiedCount > 0 && (
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/20 border border-amber-500/30" />
            <span className="font-bold">{modifiedCount}</span> modified
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">Before</span>
            <span className="text-xs text-zinc-600">Original resume</span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] max-h-[600px] overflow-y-auto py-2">
            <DiffColumn lines={beforeLines} side="before" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">After</span>
            <span className="text-xs text-zinc-600">Tailored resume</span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] max-h-[600px] overflow-y-auto py-2">
            <DiffColumn lines={afterLines} side="after" />
          </div>
        </div>
      </div>
    </div>
  );
}
