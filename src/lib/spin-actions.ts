"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireMembership } from "./account";
import { startOfDay } from "./spin";

const REWARDS = [10, 15, 20, 20, 25, 30, 50, 5, 100];

/** One free PerxCoin spin per day. Atomic + idempotent (a second spin today is rejected). */
export async function spinDaily(): Promise<{ error?: string; won?: number; balance?: number }> {
  const m = await requireMembership();
  try {
    const out = await prisma.$transaction(async (tx) => {
      const already = await tx.coinTxn.findFirst({
        where: { toEmployeeId: m.id, kind: "GRANT", memo: "Daily Spin", createdAt: { gte: startOfDay() } },
        select: { id: true },
      });
      if (already) throw new Error("ALREADY");
      const won = REWARDS[Math.floor(Math.random() * REWARDS.length)]!;
      await tx.coinTxn.create({
        data: { companyId: m.companyId, kind: "GRANT", fromEmployeeId: null, toEmployeeId: m.id, amount: won, memo: "Daily Spin" },
      });
      const up = await tx.employeeProfile.update({
        where: { id: m.id },
        data: { recognitionCoins: { increment: won } },
        select: { recognitionCoins: true },
      });
      return { won, balance: up.recognitionCoins };
    });
    revalidatePath("/dashboard/employee/spin");
    revalidatePath("/dashboard/employee/wallet");
    revalidatePath("/dashboard/employee");
    return out;
  } catch (e) {
    if ((e as Error)?.message === "ALREADY") return { error: "You've already spun today — come back tomorrow!" };
    console.error("[spinDaily]", e);
    return { error: "Spin failed — try again." };
  }
}
