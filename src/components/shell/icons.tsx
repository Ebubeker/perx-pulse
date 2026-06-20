// Inline-SVG icon set for the nav shell (no icon dependency). 24px, currentColor stroke.
type IconName =
  | "home" | "discover" | "coin" | "team" | "grid" | "inbox" | "chart" | "people"
  | "store" | "bolt" | "trophy" | "passport" | "card" | "genie" | "logout" | "more";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5" />,
  discover: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" /></>,
  coin: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M9.5 9.8c0-1.3 1.1-2 2.5-2s2.5.7 2.5 1.9-1.1 1.7-2.5 1.7-2.5.6-2.5 1.8 1.1 1.9 2.5 1.9 2.5-.7 2.5-2" /></>,
  team: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 6.2a3 3 0 0 1 0 5.6M17 14c2.4.4 4 2.3 4 5" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.3" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.3" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.3" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.3" /></>,
  inbox: <path d="M3.5 13h4l1.5 2.5h6L16.5 13h4M4 13l2.5-8.5h11L20 13v6.5H4z" />,
  chart: <path d="M4 20V4M20 20H4M8 20v-6M12 20V9M16 20v-9" />,
  people: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 6.2a3 3 0 0 1 0 5.6M17 14c2.4.4 4 2.3 4 5" /></>,
  store: <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5v10.5h16V9.5M4 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />,
  bolt: <path d="M13 3 5 13h6l-1 8 8-10h-6z" />,
  trophy: <path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7 11M17 6h3v1.5A3.5 3.5 0 0 1 17 11M9.5 13.5h5M12 13v4M8.5 20h7" />,
  passport: <><rect x="5" y="3.5" width="14" height="17" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></>,
  card: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></>,
  genie: <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6zM18 15l.8 2 2 .8-2 .8L18 21l-.8-2-2-.8 2-.8z" />,
  logout: <path d="M15 5H6v14h9M10 12h10m0 0-3-3m3 3-3 3" />,
  more: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
};

export function Icon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  const node = PATHS[name as IconName] ?? PATHS.grid;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {node}
    </svg>
  );
}
