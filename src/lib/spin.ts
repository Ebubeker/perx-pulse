import { prisma } from "./prisma";

const DAY = 86_400_000;

export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Has the employee spun today, and what's their current daily-spin streak? */
export async function getSpinState(employeeProfileId: string): Promise<{ spunToday: boolean; streak: number }> {
  const since = new Date();
  since.setDate(since.getDate() - 40);
  const spins = await prisma.coinTxn.findMany({
    where: { toEmployeeId: employeeProfileId, kind: "GRANT", memo: "Daily Spin", createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const days = new Set(spins.map((s) => startOfDay(s.createdAt).getTime()));
  const today0 = startOfDay().getTime();
  const spunToday = days.has(today0);

  // Count consecutive days backward (from today if spun, else from yesterday).
  let streak = 0;
  let cursor = spunToday ? today0 : today0 - DAY;
  while (days.has(cursor)) {
    streak++;
    cursor -= DAY;
  }
  return { spunToday, streak };
}
