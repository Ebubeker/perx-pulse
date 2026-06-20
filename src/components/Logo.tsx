import Image from "next/image";

// The Perx brand lockup: the Perx character mark (the logo) + a bold "Perx" wordmark.
// Mark is the portrait mascot at /public/perx/characters/perx-logo.png (423×590).
export function Logo({ onDark = false, className = "" }: { onDark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-[26px] font-extrabold tracking-tight ${onDark ? "text-[#F6F1E5]" : "text-ink"} ${className}`}>
      <Image src="/perx/characters/perx-logo.png" alt="Perx" width={33} height={46} priority unoptimized className="mascot-img" />
      Perx
    </span>
  );
}
