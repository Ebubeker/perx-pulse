import { Mascot } from "@/components/Mascot";

// The Perx brand lockup: the Perx character (the logo) + the "Perx" wordmark.
export function Logo({ onDark = false, className = "" }: { onDark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight ${onDark ? "text-[#F6F1E5]" : "text-ink"} ${className}`}>
      <Mascot mood="charged" size={30} />
      Perx
    </span>
  );
}
