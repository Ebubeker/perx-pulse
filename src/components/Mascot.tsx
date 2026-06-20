// "Pulse" — the AI concierge personified. Placeholder for the final illustrated
// character; flat-vector, on-brand, friendly-but-premium (not childish).
export function Mascot({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 5C43 21 51 29 51 40a19 19 0 1 1-38 0C13 29 21 21 32 5Z" fill="#14624A" />
      <path d="M44 53a19 19 0 0 0 7-13c0-11-8-19-19-35-3 4-5 8-8 11 7 11 14 22 12 33a19 19 0 0 0 8 4Z" fill="#1b7256" opacity=".55" />
      <circle cx="25.5" cy="40" r="5" fill="#fff" />
      <circle cx="38.5" cy="40" r="5" fill="#fff" />
      <circle cx="26.6" cy="41" r="2.3" fill="#1c1b18" />
      <circle cx="39.6" cy="41" r="2.3" fill="#1c1b18" />
      <path d="M27 48c2.5 2.6 7.5 2.6 10 0" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M49 13l1.8 3.9 3.9 1.8-3.9 1.8L49 24l-1.8-3.7-3.9-1.8 3.9-1.8L49 13Z" fill="#e8b339" />
    </svg>
  );
}
