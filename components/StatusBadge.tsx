const STATUS_STYLES: Record<string, { bg: string; dot: string }> = {
  Applied: { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  Interview: { bg: "bg-violet-500/10 text-violet-400 border-violet-500/20", dot: "bg-violet-400" },
  Rejected: { bg: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
  Offer: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Applied;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${style.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
