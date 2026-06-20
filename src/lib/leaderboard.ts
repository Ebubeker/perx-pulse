import { prisma } from "./prisma";
import { monthStart } from "./coins";

export type Ranked = { id: string; name: string; value: number };

/** Top coin holders in the company (most-recognized people). */
export async function topEarners(companyId: string, take = 5): Promise<Ranked[]> {
  const rows = await prisma.employeeProfile.findMany({
    where: { companyId, recognitionCoins: { gt: 0 } },
    select: { id: true, displayName: true, recognitionCoins: true },
    orderBy: { recognitionCoins: "desc" },
    take,
  });
  return rows.map((r) => ({ id: r.id, name: r.displayName, value: r.recognitionCoins }));
}

/** Most generous givers this month (kudos sent), from the ledger. */
export async function topGivers(companyId: string, take = 5): Promise<Ranked[]> {
  const grouped = await prisma.coinTxn.groupBy({
    by: ["fromEmployeeId"],
    where: { companyId, kind: "KUDOS", createdAt: { gte: monthStart() }, fromEmployeeId: { not: null } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take,
  });
  const ids = grouped.map((g) => g.fromEmployeeId).filter((x): x is string => !!x);
  if (!ids.length) return [];
  const people = await prisma.employeeProfile.findMany({ where: { id: { in: ids } }, select: { id: true, displayName: true } });
  const nameOf = new Map(people.map((p) => [p.id, p.displayName] as const));
  return grouped.map((g) => ({ id: g.fromEmployeeId!, name: nameOf.get(g.fromEmployeeId!) ?? "Someone", value: g._sum.amount ?? 0 }));
}
