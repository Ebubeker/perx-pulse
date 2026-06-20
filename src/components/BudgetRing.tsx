export function BudgetRing({ used, total, size = 128 }: { used: number; total: number; size?: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, total > 0 ? used / total : 0));
  const left = Math.max(0, total - used);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 132 132" className="-rotate-90">
        <circle cx="66" cy="66" r={r} fill="none" stroke="#e7e1d4" strokeWidth="11" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke="#14624a"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[24px] leading-none">{left.toLocaleString("en-US")} L</span>
        <span className="mt-1 text-[10.5px] text-muted">left this month</span>
      </div>
    </div>
  );
}
