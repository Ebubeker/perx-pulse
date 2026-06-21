import { prisma } from "./prisma";

const DAY = 86_400_000;

export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Derive spunToday + streak from a set of start-of-day timestamps (ms).
 * Streak counts consecutive days backward from today if spun, else from yesterday
 * (so the streak survives until end of day even before today's spin). Pure — shared
 * by the page read and the spin action so both agree.
 */
export function deriveStreak(dayKeys: Set<number>, today0: number = startOfDay().getTime()): { spunToday: boolean; streak: number } {
  const spunToday = dayKeys.has(today0);
  let streak = 0;
  let cursor = spunToday ? today0 : today0 - DAY;
  while (dayKeys.has(cursor)) {
    streak++;
    cursor -= DAY;
  }
  return { spunToday, streak };
}

/** How far back to look when reconstructing a streak from coin grants. */
export const SPIN_LOOKBACK_DAYS = 40;

/** Has the employee spun today, and what's their current daily-spin streak? */
export async function getSpinState(employeeProfileId: string): Promise<{ spunToday: boolean; streak: number }> {
  const since = new Date();
  since.setDate(since.getDate() - SPIN_LOOKBACK_DAYS);
  const spins = await prisma.coinTxn.findMany({
    where: { toEmployeeId: employeeProfileId, kind: "GRANT", memo: "Daily Spin", createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const days = new Set(spins.map((s) => startOfDay(s.createdAt).getTime()));
  return deriveStreak(days);
}
