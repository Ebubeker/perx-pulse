// Renders a coin amount, e.g. "35 🪙". The single way coins are shown across the app.
export function Coins({ amount, className = "", strike = false }: { amount: number; className?: string; strike?: boolean }) {
  return (
    <span className={`whitespace-nowrap ${strike ? "text-muted line-through" : ""} ${className}`}>
      {amount.toLocaleString("en-US")}
      <span className="ml-0.5" aria-hidden="true">🪙</span>
    </span>
  );
}
