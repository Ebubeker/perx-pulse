import { CoinIcon } from "./CoinIcon";

// Renders a coin amount as "35 ⊚" with the real SVG coin glyph.
export function Coins({ amount, className = "", strike = false }: { amount: number; className?: string; strike?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${strike ? "text-muted line-through" : ""} ${className}`}>
      {amount.toLocaleString("en-US")}
      <CoinIcon className="size-[0.85em] opacity-80" />
    </span>
  );
}
