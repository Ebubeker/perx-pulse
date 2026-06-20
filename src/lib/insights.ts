import { prisma } from "./prisma";
import { monthStart } from "./coins";
import type { OfferCategory } from "@prisma/client";

const MOODS = ["Stressful", "Tiring", "Productive", "Social", "Flat"] as const;
const CATEGORIES: OfferCategory[] = ["wellness", "fitness", "food", "health", "travel", "learning", "culture", "telecom"];

export interface CompanyInsights {
  headcount: number;
  participationPct: number; // took a pulse
  engagementPct: number; // got an approved pack or claimed a drop
  moods: { mood: string; count: number }[];
  categoryDemand: { category: OfferCategory; count: number }[];
  maxCategoryCount: number;
  budgetUsed: number;
  budgetTotal: number;
  coinsMovedThisMonth: number;
  perxScore: number;
}

export async function companyInsights(companyId: string): Promise<CompanyInsights> {
  const [headcount, pulses, approved, orders, claims, budgetAgg, coinsAgg] = await Promise.all([
    prisma.employeeProfile.count({ where: { companyId } }),
    prisma.pulse.findMany({ where: { employee: { companyId } }, select: { employeeProfileId: true, answers: true } }),
    prisma.perkPackage.findMany({ where: { companyId, status: "APPROVED" }, select: { employeeProfileId: true, totalLek: true } }),
    prisma.order.findMany({ where: { companyId }, select: { offer: { select: { category: true } } } }),
    prisma.dropClaim.findMany({ where: { employee: { companyId } }, select: { employeeProfileId: true, drop: { select: { category: true } } } }),
    prisma.employeeProfile.aggregate({ where: { companyId }, _sum: { perksBudgetLek: true } }),
    prisma.coinTxn.aggregate({ where: { companyId, kind: { in: ["KUDOS", "GRANT"] }, createdAt: { gte: monthStart() } }, _sum: { amount: true } }),
  ]);

  // Participation & engagement (distinct employees)
  const pulsers = new Set(pulses.map((p) => p.employeeProfileId));
  const engaged = new Set<string>([...approved.map((a) => a.employeeProfileId), ...claims.map((c) => c.employeeProfileId)]);
  const participationPct = headcount ? Math.round((pulsers.size / headcount) * 100) : 0;
  const engagementPct = headcount ? Math.round((engaged.size / headcount) * 100) : 0;

  // Moods from pulse "week" answers
  const moodCount = new Map<string, number>(MOODS.map((mm) => [mm, 0]));
  for (const p of pulses) {
    const week = (p.answers as Record<string, string> | null)?.week;
    if (week && moodCount.has(week)) moodCount.set(week, (moodCount.get(week) ?? 0) + 1);
  }
  const moods = MOODS.map((mood) => ({ mood, count: moodCount.get(mood) ?? 0 }));

  // Category demand from orders + drop claims
  const catCount = new Map<OfferCategory, number>(CATEGORIES.map((c) => [c, 0]));
  for (const o of orders) if (o.offer) catCount.set(o.offer.category, (catCount.get(o.offer.category) ?? 0) + 1);
  for (const c of claims) catCount.set(c.drop.category, (catCount.get(c.drop.category) ?? 0) + 1);
  const categoryDemand = CATEGORIES.map((category) => ({ category, count: catCount.get(category) ?? 0 }));
  const maxCategoryCount = Math.max(1, ...categoryDemand.map((c) => c.count));

  const budgetUsed = approved.reduce((s, a) => s + a.totalLek, 0);
  const budgetTotal = budgetAgg._sum.perksBudgetLek ?? 0;
  const coinsMovedThisMonth = coinsAgg._sum.amount ?? 0;

  // Perx Score — composite wellbeing/engagement index (0-100)
  const utilization = budgetTotal ? Math.min(1, budgetUsed / budgetTotal) : 0;
  const recognition = headcount ? Math.min(1, coinsMovedThisMonth / (headcount * 50)) : 0;
  const perxScore = Math.round(
    100 * (0.3 * (participationPct / 100) + 0.3 * (engagementPct / 100) + 0.2 * utilization + 0.2 * recognition),
  );

  return {
    headcount,
    participationPct,
    engagementPct,
    moods,
    categoryDemand,
    maxCategoryCount,
    budgetUsed,
    budgetTotal,
    coinsMovedThisMonth,
    perxScore,
  };
}
