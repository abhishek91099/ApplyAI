export function ATSScore({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? { stroke: "stroke-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Excellent" }
      : score >= 60
        ? { stroke: "stroke-amber-400", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Good" }
        : { stroke: "stroke-red-400", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Needs work" };

  return (
    <div className={`inline-flex items-center gap-3 rounded-2xl border ${color.border} ${color.bg} px-4 py-2.5`}>
      <div className="relative h-11 w-11">
        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/[0.06]" />
          <circle
            cx="22" cy="22" r="20" fill="none" strokeWidth="3" strokeLinecap="round"
            className={color.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${color.text}`}>
          {score}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold text-zinc-300">ATS Score</p>
        <p className={`text-xs font-medium ${color.text}`}>{color.label}</p>
      </div>
    </div>
  );
}
