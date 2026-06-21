import { GoogleGenAI } from "@google/genai";
import { prisma } from "./prisma";
import { toCoins } from "./currency";

let _ai: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  return _ai;
}

/** How stale a saved profile may be before we regenerate it (ms). */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface EmployeeContext {
  name: string;
  role: string;
  department: string | null;
  homeArea: string | null;
  budgetCoins: number;
  walletCoins: number;
  preferredCategories: string[];
  interests: string[];
  wellnessGoals: string[];
  dietary: string[];
  languages: string[];
  latestPulse: Record<string, string> | null;
  redeemed: string[]; // perks/drops they actually got — revealed taste
  chosenPacks: string[];
  kudosGiven: number;
  kudosReceived: number;
  recentKudosNotes: string[];
}

/** Pull EVERYTHING we know about one employee into a single structured context — the AI's raw material. */
export async function buildEmployeeContext(employeeId: string): Promise<EmployeeContext | null> {
  const m = await prisma.employeeProfile.findUnique({
    where: { id: employeeId },
    include: { department: { select: { name: true } } },
  });
  if (!m) return null;

  const [pulse, orders, claims, packages, kudosOut, kudosIn] = await Promise.all([
    prisma.pulse.findFirst({ where: { employeeProfileId: employeeId }, orderBy: { createdAt: "desc" }, select: { answers: true } }),
    prisma.order.findMany({ where: { employeeProfileId: employeeId }, orderBy: { createdAt: "desc" }, take: 8, select: { title: true } }),
    prisma.dropClaim.findMany({ where: { employeeProfileId: employeeId }, orderBy: { createdAt: "desc" }, take: 6, include: { drop: { select: { title: true } } } }),
    prisma.perkPackage.findMany({ where: { employeeProfileId: employeeId }, orderBy: { createdAt: "desc" }, take: 6, select: { label: true } }),
    prisma.coinTxn.findMany({ where: { fromEmployeeId: employeeId, kind: "KUDOS" }, orderBy: { createdAt: "desc" }, take: 5, select: { memo: true } }),
    prisma.coinTxn.count({ where: { toEmployeeId: employeeId, kind: "KUDOS" } }),
  ]);

  const answers = pulse?.answers && typeof pulse.answers === "object" && !Array.isArray(pulse.answers)
    ? (pulse.answers as Record<string, string>)
    : null;

  return {
    name: m.displayName,
    role: m.role,
    department: m.department?.name ?? null,
    homeArea: m.homeArea,
    budgetCoins: toCoins(m.perksBudgetLek),
    walletCoins: m.recognitionCoins,
    preferredCategories: m.preferredCategories,
    interests: m.interests,
    wellnessGoals: m.wellnessGoals,
    dietary: m.dietary,
    languages: m.languages,
    latestPulse: answers,
    redeemed: [...orders.map((o) => o.title), ...claims.map((c) => c.drop.title)],
    chosenPacks: packages.map((p) => p.label),
    kudosGiven: kudosOut.length,
    kudosReceived: kudosIn,
    recentKudosNotes: kudosOut.map((k) => k.memo).filter((x): x is string => !!x),
  };
}

/** A deterministic one-paragraph profile from the raw context — used as the fallback when the model is unavailable. */
function deterministicProfile(c: EmployeeContext): string {
  const bits: string[] = [];
  bits.push(`${c.name}${c.department ? `, ${c.department}` : ""}${c.homeArea ? `, based in ${c.homeArea}` : ""}.`);
  if (c.preferredCategories.length || c.interests.length) {
    bits.push(`Leans toward ${[...c.preferredCategories, ...c.interests].slice(0, 4).join(", ")}.`);
  }
  if (c.wellnessGoals.length) bits.push(`Wellness goals: ${c.wellnessGoals.slice(0, 3).join(", ")}.`);
  if (c.dietary.length) bits.push(`Dietary: ${c.dietary.join(", ")}.`);
  if (c.redeemed.length) bits.push(`Has enjoyed ${c.redeemed.slice(0, 4).join(", ")}.`);
  if (c.kudosGiven) bits.push(`Recognizes teammates often (${c.kudosGiven} kudos given).`);
  bits.push(`${c.walletCoins} coins to spend.`);
  return bits.join(" ");
}

/** Ask the model to write a tight internal profile of the employee from their full context. */
export async function generateEmployeeProfile(employeeId: string): Promise<string | null> {
  const ctx = await buildEmployeeContext(employeeId);
  if (!ctx) return null;

  let profile = deterministicProfile(ctx);
  try {
    const prompt =
      `Write a tight internal profile of an employee for a benefits concierge AI to use when personalizing perks. ` +
      `60 to 90 words, third person, warm but factual. Capture their tastes, lifestyle, dietary and wellness needs, ` +
      `how they spend, and how they engage with recognition. No headings, no bullet points, no em dashes.\n\n` +
      `DATA:\n${JSON.stringify(ctx)}`;
    const resp = await ai().models.generateContent({
      model: process.env.MODEL_PERSONA || "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.6, maxOutputTokens: 320, thinkingConfig: { thinkingBudget: 0 } },
    });
    const text = (resp as { text?: string }).text?.trim().replace(/\s*—\s*/g, ", ");
    if (text && text.length > 30) profile = text;
  } catch (e) {
    console.error("[ai-profile] model fallback:", (e as Error)?.message || e);
  }

  await prisma.employeeProfile.update({ where: { id: employeeId }, data: { aiProfile: profile, aiProfileAt: new Date() } });
  return profile;
}

/** Regenerate the profile after a meaningful event. Never throws — safe to fire alongside other work. */
export async function refreshEmployeeProfile(employeeId: string): Promise<void> {
  try { await generateEmployeeProfile(employeeId); } catch (e) { console.error("[ai-profile] refresh:", e); }
}

/** Make sure a usable profile exists (generate if missing or stale). Returns the current profile text. */
export async function ensureEmployeeProfile(employeeId: string, current: string | null, at: Date | null): Promise<string | null> {
  const fresh = current && at && Date.now() - at.getTime() < MAX_AGE_MS;
  if (fresh) return current;
  return (await generateEmployeeProfile(employeeId)) ?? current;
}
