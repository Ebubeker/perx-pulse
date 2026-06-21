import { prisma } from "./prisma";
import { toLek } from "./currency";
import { getCatalog, type CatalogOffer } from "./gemini";

/** Start of the current calendar month — the window monthly stats roll up over. */
export function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Recent recognition across the company — the culture wall (kudos + company awards). */
export async function companyRecognitionFeed(companyId: string, take = 15) {
  return prisma.coinTxn.findMany({
    where: { companyId, kind: { in: ["KUDOS", "GRANT"] } },
    include: { from: { select: { displayName: true } }, to: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Company-side recognition rollup for the current month: coins given to employees + kudos exchanged. */
export async function companyRecognitionStats(companyId: string) {
  const since = monthStart();
  const [grants, kudos] = await Promise.all([
    prisma.coinTxn.findMany({ where: { companyId, kind: "GRANT", createdAt: { gte: since } }, select: { amount: true, toEmployeeId: true, memo: true } }),
    prisma.coinTxn.aggregate({ where: { companyId, kind: "KUDOS", createdAt: { gte: since } }, _count: true }),
  ]);
  // Spin grants are employee earnings, not company-funded recognition — exclude them.
  const given = grants.filter((g) => !/spin/i.test(g.memo ?? ""));
  return {
    givenCoins: given.reduce((s, g) => s + g.amount, 0),
    recipients: new Set(given.map((g) => g.toEmployeeId)).size,
    kudosCount: kudos._count,
  };
}

/** Has this month's monthly spread already been distributed for the company? */
export async function spreadDistributedThisMonth(companyId: string): Promise<boolean> {
  const x = await prisma.coinTxn.findFirst({
    where: { companyId, kind: "GRANT", memo: "Monthly allowance", createdAt: { gte: monthStart() } },
    select: { id: true },
  });
  return !!x;
}

export type HistoryKind = "spin" | "monthly" | "award" | "kudos-in" | "kudos-out" | "spend" | "adjust";
export interface HistoryRow {
  id: string;
  kind: HistoryKind;
  label: string;
  memo: string | null;
  amount: number; // always positive
  signed: number; // + earned, − spent/given
  at: Date;
}

/** The full personal coin ledger for one employee — every coin in and out, newest first. */
export async function walletHistory(employeeId: string, take = 60): Promise<HistoryRow[]> {
  const txns = await prisma.coinTxn.findMany({
    where: { OR: [{ toEmployeeId: employeeId }, { fromEmployeeId: employeeId }] },
    include: { from: { select: { displayName: true } }, to: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
  return txns.map((t) => {
    const incoming = t.toEmployeeId === employeeId;
    let kind: HistoryKind;
    let label: string;
    if (t.kind === "GRANT") {
      if (t.memo === "Daily Spin" || /spin/i.test(t.memo ?? "")) { kind = "spin"; label = "Spin reward"; }
      else if (/month|allowance|weekly|week/i.test(t.memo ?? "")) { kind = "monthly"; label = t.memo || "Allowance top-up"; }
      else { kind = "award"; label = t.memo || "Company award"; }
    } else if (t.kind === "KUDOS") {
      if (incoming) { kind = "kudos-in"; label = `Kudos from ${t.from?.displayName ?? "a colleague"}`; }
      else { kind = "kudos-out"; label = `Kudos to ${t.to?.displayName ?? "a colleague"}`; }
    } else if (t.kind === "SPEND") {
      kind = "spend"; label = t.memo || "Redeemed a perk";
    } else {
      kind = "adjust"; label = t.memo || "Adjustment";
    }
    return { id: t.id, kind, label, memo: t.memo, amount: t.amount, signed: (incoming ? 1 : -1) * t.amount, at: t.createdAt };
  });
}

export interface CoinSummary {
  earnedThisMonth: number; // grants/awards/spin received
  spentThisMonth: number; // perks + drops
  givenThisMonth: number; // kudos sent
  receivedThisMonth: number; // kudos received
}

/** This calendar month's coin flow for one employee. */
export async function coinSummary(employeeId: string): Promise<CoinSummary> {
  const since = monthStart();
  const [earned, spent, given, received] = await Promise.all([
    prisma.coinTxn.aggregate({ where: { toEmployeeId: employeeId, kind: "GRANT", createdAt: { gte: since } }, _sum: { amount: true } }),
    prisma.coinTxn.aggregate({ where: { fromEmployeeId: employeeId, kind: "SPEND", createdAt: { gte: since } }, _sum: { amount: true } }),
    prisma.coinTxn.aggregate({ where: { fromEmployeeId: employeeId, kind: "KUDOS", createdAt: { gte: since } }, _sum: { amount: true } }),
    prisma.coinTxn.aggregate({ where: { toEmployeeId: employeeId, kind: "KUDOS", createdAt: { gte: since } }, _sum: { amount: true } }),
  ]);
  return {
    earnedThisMonth: earned._sum.amount ?? 0,
    spentThisMonth: spent._sum.amount ?? 0,
    givenThisMonth: given._sum.amount ?? 0,
    receivedThisMonth: received._sum.amount ?? 0,
  };
}

/** Best-value perks to spend coins on — biggest discount first, affordable within the wallet. */
export async function bestValueOffers(balanceCoins: number, take = 4): Promise<CatalogOffer[]> {
  const catalog = await getCatalog();
  const balanceLek = toLek(balanceCoins);
  const affordable = catalog.filter((o) => o.effLek <= balanceLek);
  const pool = affordable.length >= take ? affordable : catalog;
  return [...pool]
    .sort((a, b) => b.discountPct - a.discountPct || a.effLek - b.effLek)
    .slice(0, take);
}
