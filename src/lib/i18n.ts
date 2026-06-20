import { cookies } from "next/headers";

export type Locale = "en" | "sq";
export const LOCALES: Locale[] = ["en", "sq"];
export const LOCALE_COOKIE = "locale";

type Dict = Record<string, string>;

const en: Dict = {
  "landing.tagline": "The perks employees actually want.",
  "landing.sub": "AI-built benefit packs, peer recognition, and a local provider marketplace — built for Albania, ready for the world.",
  "landing.create": "Create account",
  "landing.signin": "Sign in",
  "common.morning": "Good morning,",
  "home.budget": "Perks budget",
  "home.coins": "coins",
  "home.pulse": "Take this week's Pulse →",
  "home.genie": "✨ Ask Perx Genie",
  "home.recognize": "🪙 Recognize a colleague",
  "home.drops": "⚡ Drops",
  "home.passport": "🛂 Passport",
  "home.team": "👥 Team packs",
  "home.leaderboard": "🏆 Leaderboard",
  "home.latest": "Your latest pack",
  "status.DRAFT": "draft",
  "status.PENDING": "awaiting approval",
  "status.APPROVED": "approved",
  "status.REJECTED": "declined",
  // Navigation shell
  "nav.home": "Home",
  "nav.discover": "Discover",
  "nav.coins": "Coins",
  "nav.team": "Team",
  "nav.overview": "Overview",
  "nav.approvals": "Approvals",
  "nav.insights": "Insights",
  "nav.people": "People",
  "nav.drops": "Drops",
  "nav.leaderboard": "Leaderboard",
  "nav.passport": "Passport",
  "nav.genie": "Genie",
  "nav.recognition": "Recognition",
  "nav.billing": "Billing",
  "nav.more": "More",
  "nav.back": "Back",
  "page.pulse": "Weekly Pulse",
  "page.pack": "Your pack",
  "action.signout": "Sign out",
};

const sq: Dict = {
  "landing.tagline": "Përfitimet që punonjësit duan vërtet.",
  "landing.sub": "Paketa përfitimesh nga AI, mirënjohje mes kolegëve, dhe një treg lokal ofruesish — ndërtuar për Shqipërinë, gati për botën.",
  "landing.create": "Krijo llogari",
  "landing.signin": "Hyr",
  "common.morning": "Mirëmëngjes,",
  "home.budget": "Buxheti i përfitimeve",
  "home.coins": "monedha",
  "home.pulse": "Plotëso Pulse-in e javës →",
  "home.genie": "✨ Pyet Perx Genie",
  "home.recognize": "🪙 Vlerëso një koleg",
  "home.drops": "⚡ Oferta flash",
  "home.passport": "🛂 Pasaporta",
  "home.team": "👥 Paketa ekipi",
  "home.leaderboard": "🏆 Klasifikimi",
  "home.latest": "Paketa jote e fundit",
  "status.DRAFT": "draft",
  "status.PENDING": "në pritje të miratimit",
  "status.APPROVED": "miratuar",
  "status.REJECTED": "refuzuar",
  // Navigation shell
  "nav.home": "Kreu",
  "nav.discover": "Zbulo",
  "nav.coins": "Monedhat",
  "nav.team": "Ekipi",
  "nav.overview": "Përmbledhje",
  "nav.approvals": "Miratimet",
  "nav.insights": "Statistikat",
  "nav.people": "Njerëzit",
  "nav.drops": "Oferta",
  "nav.leaderboard": "Klasifikimi",
  "nav.passport": "Pasaporta",
  "nav.genie": "Genie",
  "nav.recognition": "Mirënjohje",
  "nav.billing": "Faturimi",
  "nav.more": "Më shumë",
  "nav.back": "Mbrapa",
  "page.pulse": "Pulse javor",
  "page.pack": "Paketa jote",
  "action.signout": "Dil",
};

const DICTS: Record<Locale, Dict> = { en, sq };

/** All shell labels for the current locale (with EN fallback for any untranslated key). */
export async function getShellLabels(): Promise<Record<string, string>> {
  const locale = await getLocale();
  return locale === "sq" ? { ...en, ...sq } : { ...en };
}

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  return v === "sq" || v === "en" ? v : "en";
}

/** Server-side translator for the current request's locale. */
export async function getT(): Promise<{ t: (key: string) => string; locale: Locale }> {
  const locale = await getLocale();
  const dict = DICTS[locale];
  return { locale, t: (key: string) => dict[key] ?? en[key] ?? key };
}
