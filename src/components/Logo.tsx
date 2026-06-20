import { Mascot } from "@/components/Mascot";

// The Perx brand lockup: the Perx character (the logo) + a bold "Perx" wordmark.
export function Logo({ onDark = false, className = "" }: { onDark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-[26px] font-extrabold tracking-tight ${onDark ? "text-[#F6F1E5]" : "text-ink"} ${className}`}>
      <Mascot mood="charged" size={44} />
      Perx
    </span>
  );
}
