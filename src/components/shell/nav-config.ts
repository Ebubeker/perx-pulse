// Single source of truth for the app shell's navigation. Data only — no JSX, server-safe.

export type Role = "employee" | "company" | "provider";

export interface NavItem {
  key: string;
  labelKey: string; // i18n key
  href: string;
  match: "exact" | "prefix";
  icon: string;
  badge?: "approvals"; // dynamic badge source
  also?: string[]; // extra path prefixes that should light this tab
}

export const ROLE_HOME: Record<Role, string> = {
  employee: "/dashboard/employee",
  company: "/dashboard/company",
  provider: "/dashboard/provider",
};

// Bottom tab bar (mobile) + top of the sidebar.
export const NAV_PRIMARY: Record<Role, NavItem[]> = {
  employee: [
    { key: "home", labelKey: "nav.home", href: "/dashboard/employee", match: "exact", icon: "home", also: ["/dashboard/employee/passport", "/dashboard/employee/discover", "/dashboard/employee/pulse", "/dashboard/employee/package", "/dashboard/employee/offer", "/dashboard/employee/provider"] },
    { key: "coins", labelKey: "nav.coins", href: "/dashboard/recognition", match: "prefix", icon: "coin", also: ["/dashboard/employee/drops", "/dashboard/leaderboard"] },
    { key: "team", labelKey: "nav.team", href: "/dashboard/team", match: "prefix", icon: "team" },
  ],
  company: [
    { key: "overview", labelKey: "nav.overview", href: "/dashboard/company", match: "exact", icon: "grid" },
    { key: "approvals", labelKey: "nav.approvals", href: "/dashboard/company/approvals", match: "prefix", icon: "inbox", badge: "approvals" },
    { key: "insights", labelKey: "nav.insights", href: "/dashboard/company/insights", match: "prefix", icon: "chart" },
    { key: "people", labelKey: "nav.people", href: "/dashboard/company/people", match: "prefix", icon: "people" },
  ],
  provider: [
    { key: "home", labelKey: "nav.home", href: "/dashboard/provider", match: "exact", icon: "store" },
    { key: "drops", labelKey: "nav.drops", href: "/dashboard/provider/drops", match: "prefix", icon: "bolt" },
  ],
};

// Desktop sidebar only (also reachable in-page via each role's home launchpad on mobile).
export const NAV_SECONDARY: Record<Role, NavItem[]> = {
  employee: [
    { key: "wallet", labelKey: "nav.wallet", href: "/dashboard/employee/wallet", match: "prefix", icon: "card" },
    { key: "drops", labelKey: "nav.drops", href: "/dashboard/employee/drops", match: "prefix", icon: "bolt" },
    { key: "leaderboard", labelKey: "nav.leaderboard", href: "/dashboard/leaderboard", match: "prefix", icon: "trophy" },
    { key: "passport", labelKey: "nav.passport", href: "/dashboard/employee/passport", match: "prefix", icon: "passport" },
    { key: "genie", labelKey: "nav.genie", href: "/dashboard/employee/genie", match: "prefix", icon: "genie" },
  ],
  company: [
    { key: "recognition", labelKey: "nav.recognition", href: "/dashboard/recognition", match: "prefix", icon: "coin" },
    { key: "leaderboard", labelKey: "nav.leaderboard", href: "/dashboard/leaderboard", match: "prefix", icon: "trophy" },
    { key: "team", labelKey: "nav.team", href: "/dashboard/team", match: "prefix", icon: "team" },
    { key: "billing", labelKey: "nav.billing", href: "/dashboard/company/billing", match: "prefix", icon: "card" },
  ],
  provider: [],
};

export function allItems(role: Role): NavItem[] {
  return [...NAV_PRIMARY[role], ...NAV_SECONDARY[role]];
}

/** Is this nav item the active one for the current path? Longest-prefix-aware. */
export function isActive(pathname: string, item: NavItem): boolean {
  const hit = (base: string) =>
    item.match === "exact" ? pathname === base : pathname === base || pathname.startsWith(base + "/");
  if (hit(item.href)) return true;
  return (item.also ?? []).some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Page titles (i18n keys), longest-prefix match wins.
const TITLES: { prefix: string; key: string }[] = [
  { prefix: "/dashboard/employee/pulse", key: "page.pulse" },
  { prefix: "/dashboard/employee/discover", key: "nav.discover" },
  { prefix: "/dashboard/employee/package", key: "page.pack" },
  { prefix: "/dashboard/employee/offer", key: "page.offer" },
  { prefix: "/dashboard/employee/provider", key: "page.provider" },
  { prefix: "/dashboard/employee/wallet", key: "nav.wallet" },
  { prefix: "/dashboard/employee/genie", key: "nav.genie" },
  { prefix: "/dashboard/employee/drops", key: "nav.drops" },
  { prefix: "/dashboard/employee/passport", key: "nav.passport" },
  { prefix: "/dashboard/employee", key: "nav.home" },
  { prefix: "/dashboard/company/approvals", key: "nav.approvals" },
  { prefix: "/dashboard/company/insights", key: "nav.insights" },
  { prefix: "/dashboard/company/people", key: "nav.people" },
  { prefix: "/dashboard/company/billing", key: "nav.billing" },
  { prefix: "/dashboard/company", key: "nav.overview" },
  { prefix: "/dashboard/provider/drops", key: "nav.drops" },
  { prefix: "/dashboard/provider", key: "nav.home" },
  { prefix: "/dashboard/recognition", key: "nav.recognition" },
  { prefix: "/dashboard/leaderboard", key: "nav.leaderboard" },
  { prefix: "/dashboard/team", key: "nav.team" },
];

// Explicit back targets for detail/stack routes (everything else falls back to the role home).
const PARENTS: { prefix: string; back: string }[] = [
  { prefix: "/dashboard/employee/package", back: "/dashboard/employee" },
  { prefix: "/dashboard/company/approvals/", back: "/dashboard/company/approvals" },
  { prefix: "/dashboard/company/billing/success", back: "/dashboard/company/billing" },
  { prefix: "/dashboard/company/people/", back: "/dashboard/company/people" },
];

function longest<T extends { prefix: string }>(pathname: string, list: T[]): T | null {
  let best: T | null = null;
  for (const e of list) {
    if ((pathname === e.prefix || pathname.startsWith(e.prefix)) && (!best || e.prefix.length > best.prefix.length)) best = e;
  }
  return best;
}

/** Resolve the top-bar title + back target for a path, given the role. */
export function resolveHeader(pathname: string, role: Role): { titleKey: string; back: string | null } {
  const titleKey = longest(pathname, TITLES)?.key ?? "nav.home";

  // A primary-tab root shows the brand, not a back chevron.
  const isTabRoot = NAV_PRIMARY[role].some((i) => i.href === pathname);
  if (isTabRoot) return { titleKey, back: null };

  const explicit = longest(pathname, PARENTS)?.back;
  return { titleKey, back: explicit ?? ROLE_HOME[role] };
}
