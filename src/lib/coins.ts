import { prisma } from "./prisma";

/** Start of the current calendar month — the window the kudos allowance refreshes on. */
export function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Coins this person can still GIVE this month = monthly allowance − kudos sent since the 1st. */
export async function kudosRemainingFor(employeeId: string, monthlyAllowance: number): Promise<number> {
  const agg = await prisma.coinTxn.aggregate({
    where: { fromEmployeeId: employeeId, kind: "KUDOS", createdAt: { gte: monthStart() } },
    _sum: { amount: true },
  });
  return Math.max(0, monthlyAllowance - (agg._sum.amount ?? 0));
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
