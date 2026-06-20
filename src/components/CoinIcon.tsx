// The PerxCoin glyph (two overlapping rings) — an SVG, so it renders identically everywhere
// (no emoji-font dependency). Inherits currentColor + sizes to the font (1em) by default.
export function CoinIcon({ className = "size-[1em]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
