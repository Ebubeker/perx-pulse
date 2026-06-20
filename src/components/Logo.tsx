// The Perx brand lockup: a lime "P" disc + the "Perx" wordmark.
export function Logo({ onDark = false, className = "" }: { onDark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight ${onDark ? "text-[#F6F1E5]" : "text-ink"} ${className}`}>
      <span className="grid size-6 place-items-center rounded-full bg-lime font-serif text-[15px] font-semibold text-ink">P</span>
      Perx
    </span>
  );
}
