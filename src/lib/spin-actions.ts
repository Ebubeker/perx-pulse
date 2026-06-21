"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireMembership } from "./account";
import { startOfDay, deriveStreak, SPIN_LOOKBACK_DAYS } from "./spin";
import { SPIN_SEGMENTS, STREAK_GOAL, STREAK_BONUS } from "./spin-config";

export interface SpinResult {
  error?: string;
  won?: number; // base coins from the wheel
  index?: number; // winning wheel segment (so the client lands on it)
  bonus?: number; // streak-completion bonus (0 unless the ring was completed)
  streak?: number; // streak after this spin
  balance?: number; // new wallet balance
}

/**
 * One free PerxCoin spin per day. Atomic + idempotent (a second spin today is
 * rejected). The reward is deliberately symbolic — see spin-config.ts for the rules.
 */
export async function spinDaily(): Promise<SpinResult> {
  const m = await requireMembership();
  try {
    const out = await prisma.$transaction(async (tx) => {
      // Once-per-day guard (atomic): reject if a spin grant already exists today.
      const already = await tx.coinTxn.findFirst({
        where: { toEmployeeId: m.id, kind: "GRANT", memo: "Daily Spin", createdAt: { gte: startOfDay() } },
        select: { id: true },
      });
      if (already) throw new Error("ALREADY");

      // Server picks the winning segment; the client animates to this index.
      const index = Math.floor(Math.random() * SPIN_SEGMENTS.length);
      const won = SPIN_SEGMENTS[index]!;
      await tx.coinTxn.create({
        data: { companyId: m.companyId, kind: "GRANT", fromEmployeeId: null, toEmployeeId: m.id, amount: won, memo: "Daily Spin" },
      });

      // Recompute the streak now that today's spin is recorded.
      const since = new Date();
      since.setDate(since.getDate() - SPIN_LOOKBACK_DAYS);
      const spins = await tx.coinTxn.findMany({
        where: { toEmployeeId: m.id, kind: "GRANT", memo: "Daily Spin", createdAt: { gte: since } },
        select: { createdAt: true },
      });
      const days = new Set(spins.map((s) => startOfDay(s.createdAt).getTime()));
      const { streak } = deriveStreak(days);

      // Completing a full ring pays the one-time streak bonus (recorded separately
      // so it never counts as a "spin day" itself).
      const bonus = streak > 0 && streak % STREAK_GOAL === 0 ? STREAK_BONUS : 0;
      if (bonus > 0) {
        await tx.coinTxn.create({
          data: { companyId: m.companyId, kind: "GRANT", fromEmployeeId: null, toEmployeeId: m.id, amount: bonus, memo: "Daily Spin Streak" },
        });
      }

      const up = await tx.employeeProfile.update({
        where: { id: m.id },
        data: { recognitionCoins: { increment: won + bonus } },
        select: { recognitionCoins: true },
      });
      return { won, index, bonus, streak, balance: up.recognitionCoins };
    });
    revalidatePath("/dashboard/employee/spin");
    revalidatePath("/dashboard/employee/wallet");
    revalidatePath("/dashboard/employee");
    return out;
  } catch (e) {
    if ((e as Error)?.message === "ALREADY") return { error: "You've already spun today. Come back tomorrow!" };
    console.error("[spinDaily]", e);
    return { error: "Spin failed. Try again." };
  }
}

/**
 * DEV ONLY: undo today's spin so the wheel can be replayed while testing.
 * Deletes today's spin/bonus grants and refunds the coins. No-op in production.
 */
export async function resetSpinToday(): Promise<{ error?: string; balance?: number; streak?: number }> {
  if (process.env.NODE_ENV === "production") return { error: "Disabled in production." };
  const m = await requireMembership();
  const grants = await prisma.coinTxn.findMany({
    where: { toEmployeeId: m.id, kind: "GRANT", memo: { in: ["Daily Spin", "Daily Spin Streak"] }, createdAt: { gte: startOfDay() } },
    select: { id: true, amount: true },
  });
  const refund = grants.reduce((s, g) => s + g.amount, 0);
  const [, prof] = await prisma.$transaction([
    prisma.coinTxn.deleteMany({ where: { id: { in: grants.map((g) => g.id) } } }),
    prisma.employeeProfile.update({ where: { id: m.id }, data: { recognitionCoins: { decrement: refund } }, select: { recognitionCoins: true } }),
  ]);

  const since = new Date();
  since.setDate(since.getDate() - SPIN_LOOKBACK_DAYS);
  const spins = await prisma.coinTxn.findMany({
    where: { toEmployeeId: m.id, kind: "GRANT", memo: "Daily Spin", createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const days = new Set(spins.map((s) => startOfDay(s.createdAt).getTime()));
  const { streak } = deriveStreak(days);

  revalidatePath("/dashboard/employee/spin");
  revalidatePath("/dashboard/employee/wallet");
  revalidatePath("/dashboard/employee");
  return { balance: prof.recognitionCoins, streak };
}
