import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { prisma } from "./prisma";
import type { BudgetMode } from "@prisma/client";
import { effectiveLek } from "./currency";

let _ai: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  return _ai;
}

export interface CatalogOffer {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priceLek: number; // list price (Lek)
  discountPct: number;
  effLek: number; // effective price after discount (Lek) — what's actually charged
  area: string | null;
  providerName: string;
  taxFree: boolean;
}

/** All active offers across the marketplace, with provider names — the AI's menu. */
export async function getCatalog(): Promise<CatalogOffer[]> {
  const offers = await prisma.offer.findMany({
    where: { active: true },
    include: { provider: { select: { businessName: true } } },
    orderBy: { createdAt: "asc" },
  });
  return offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    category: o.category,
    priceLek: o.priceLek,
    discountPct: o.discountPct,
    effLek: effectiveLek(o.priceLek, o.discountPct),
    area: o.area,
    providerName: o.provider.businessName,
    taxFree: o.taxFree,
  }));
}

/** Resolve a list of offer ids to full offers, preserving order — for rendering packs. */
export async function resolveOffers(ids: string[]): Promise<CatalogOffer[]> {
  if (!ids.length) return [];
  const offers = await prisma.offer.findMany({ where: { id: { in: ids } }, include: { provider: { select: { businessName: true } } } });
  const byId = new Map(offers.map((o) => [o.id, o] as const));
  return ids
    .map((id) => byId.get(id))
    .filter((o): o is NonNullable<typeof o> => !!o)
    .map((o) => ({ id: o.id, title: o.title, description: o.description, category: o.category, priceLek: o.priceLek, discountPct: o.discountPct, effLek: effectiveLek(o.priceLek, o.discountPct), area: o.area, providerName: o.provider.businessName, taxFree: o.taxFree }));
}

export interface RecPack {
  label: string;
  rationale: string;
  itemOfferIds: string[];
  totalLek: number;
}

const Schema = z.object({
  packages: z.array(
    z.object({ label: z.string(), rationale: z.string(), offerIds: z.array(z.string()) }),
  ),
});

// Smart Budget Modes shape the spend.
function effectiveBudget(mode: BudgetMode, budget: number): number {
  if (mode === "SAVE_SOME") return Math.floor(budget * 0.7);
  return budget;
}

function modeGuidance(mode: BudgetMode): string {
  switch (mode) {
    case "SAVE_SOME":
      return "The employee wants to SAVE — use at most ~70% of the budget and keep packs lean.";
    case "TREAT_MYSELF":
      return "The employee wants to TREAT themselves — include one premium, higher-value offer.";
    case "TEAM":
      return "The employee wants TEAM activities — prefer group/shareable offers (dinners, classes, activities).";
    default:
      return "Use the budget well across complementary offers.";
  }
}

function build(p: { label: string; rationale: string; offerIds: string[] }, byId: Map<string, CatalogOffer>, budget: number): RecPack | null {
  const items = p.offerIds.map((id) => byId.get(id)).filter((o): o is CatalogOffer => !!o);
  if (!items.length) return null;
  let total = items.reduce((s, o) => s + o.effLek, 0);
  while (total > budget && items.length > 1) {
    items.pop();
    total = items.reduce((s, o) => s + o.effLek, 0);
  }
  if (total > budget) return null;
  return { label: p.label, rationale: p.rationale, itemOfferIds: items.map((o) => o.id), totalLek: total };
}

export async function recommendPackages(opts: {
  answers: Record<string, string>;
  budgetMode: BudgetMode;
  budgetLek: number;
  personalization: { preferredCategories: string[]; interests: string[]; wellnessGoals: string[]; dietary: string[]; homeArea: string | null };
}): Promise<RecPack[]> {
  const catalog = await getCatalog();
  if (!catalog.length) return [];
  const byId = new Map(catalog.map((o) => [o.id, o] as const));
  const budget = effectiveBudget(opts.budgetMode, opts.budgetLek);

  const menu = catalog
    .map((o) => `${o.id} | ${o.title} | ${o.category} | ${o.effLek} Lek | ${o.area ?? ""}${o.taxFree ? " | tax-free" : ""} | ${o.providerName}`)
    .join("\n");

  const prompt =
    `You are a benefits concierge for employees in Tirana, Albania. From ONLY the catalog below, build 3 themed perk PACKAGES. ` +
    `Each package combines 2-4 offers (prefer DIFFERENT providers), combined total AT OR UNDER ${budget} Lek. ` +
    `${modeGuidance(opts.budgetMode)} ` +
    `Match the employee's weekly check-in and preferences. Give each a short human label (no emojis) and a one-sentence rationale.\n\n` +
    `Weekly check-in: ${JSON.stringify(opts.answers)}\n` +
    `Preferences: ${JSON.stringify(opts.personalization)}\n\n` +
    `CATALOG (use the exact id):\n${menu}\n\n` +
    `Return ONLY JSON: {"packages":[{"label":"...","rationale":"...","offerIds":["id1","id2"]}]}`;

  try {
    const resp = await ai().models.generateContent({
      model: process.env.MODEL_PERSONA || "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 1100, thinkingConfig: { thinkingBudget: 0 } },
    });
    const parsed = Schema.parse(JSON.parse((resp as { text?: string }).text || "{}"));
    const packs = parsed.packages.map((p) => build(p, byId, budget)).filter((p): p is RecPack => !!p).slice(0, 3);
    if (packs.length) return packs;
  } catch (e) {
    console.error("[gemini] falling back:", (e as Error)?.message || e);
  }
  return fallback(catalog, opts, budget);
}

// ── Perx Genie: free-text AI concierge ──────────────────────────────────────
export interface GenieReply {
  answer: string;
  offerIds: string[];
}

const GenieSchema = z.object({ answer: z.string(), offerIds: z.array(z.string()).default([]) });

export async function askGenie(opts: {
  question: string;
  budgetLek: number;
  personalization: { preferredCategories: string[]; interests: string[]; wellnessGoals: string[]; dietary: string[]; homeArea: string | null };
}): Promise<GenieReply> {
  const catalog = await getCatalog();
  const byId = new Map(catalog.map((o) => [o.id, o] as const));
  const menu = catalog
    .map((o) => `${o.id} | ${o.title} | ${o.category} | ${o.priceLek} Lek | ${o.area ?? ""} | ${o.providerName}`)
    .join("\n");

  const prompt =
    `You are Perx Genie, a warm, concise benefits concierge for an employee in Tirana, Albania. ` +
    `Answer their question in 2-3 friendly sentences and recommend up to 3 specific offers from the catalog (by exact id). ` +
    `Their monthly perk budget is ${opts.budgetLek} Lek (employer-funded, tax-free). Stay within budget and be concrete.\n\n` +
    `Question: ${opts.question}\n` +
    `Their preferences: ${JSON.stringify(opts.personalization)}\n\n` +
    `CATALOG:\n${menu}\n\n` +
    `Return ONLY JSON: {"answer":"...","offerIds":["id1","id2"]}`;

  try {
    const resp = await ai().models.generateContent({
      model: process.env.MODEL_PERSONA || "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 700, thinkingConfig: { thinkingBudget: 0 } },
    });
    const parsed = GenieSchema.parse(JSON.parse((resp as { text?: string }).text || "{}"));
    const offerIds = parsed.offerIds.filter((id) => byId.has(id)).slice(0, 3);
    if (parsed.answer.trim()) return { answer: parsed.answer.trim(), offerIds };
  } catch (e) {
    console.error("[genie] falling back:", (e as Error)?.message || e);
  }
  // Deterministic fallback: keyword match on the question.
  const q = opts.question.toLowerCase();
  const picks = catalog
    .filter((o) => q.includes(o.category) || opts.personalization.preferredCategories.includes(o.category))
    .slice(0, 3);
  return {
    answer: "Here are a few options from your catalog that fit. Tap any to explore — it's all tax-free and inside your budget.",
    offerIds: picks.map((o) => o.id),
  };
}

function fallback(catalog: CatalogOffer[], opts: { answers: Record<string, string>; personalization: { preferredCategories: string[] } }, budget: number): RecPack[] {
  const wants = (Object.values(opts.answers).join(" ") + " " + opts.personalization.preferredCategories.join(" ")).toLowerCase();
  const score = (o: CatalogOffer) => (wants.includes(o.category) ? 2 : 0) + (o.taxFree ? 0.2 : 0);
  const sorted = [...catalog].sort((a, b) => score(b) - score(a));
  const pick = (skip: Set<string>): RecPack => {
    const items: CatalogOffer[] = [];
    let total = 0;
    for (const o of sorted) {
      if (skip.has(o.id)) continue;
      if (items.some((i) => i.providerName === o.providerName)) continue;
      if (total + o.effLek <= budget) {
        items.push(o);
        total += o.effLek;
      }
      if (items.length >= 3) break;
    }
    return { label: "Your reset pack", rationale: "Picked to match your week and your budget.", itemOfferIds: items.map((o) => o.id), totalLek: total };
  };
  const first = pick(new Set());
  const second = pick(new Set(first.itemOfferIds));
  return [first, second].filter((p) => p.itemOfferIds.length);
}
