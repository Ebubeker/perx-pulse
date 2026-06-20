"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireMembership, requireCompanyAdmin } from "./account";
import { monthStart } from "./coins";

const MAX_GRANT = 100_000;

/** Employee recognizes a colleague — draws from the giver's monthly allowance, credits the receiver's balance. */
export async function giveKudos(toEmployeeId: string, amount: number, memo: string): Promise<{ error?: string }> {
  const m = await requireMembership();
  const reason = memo.trim().slice(0, 280);
  if (!reason) return { error: "Add a reason — recognition lands better with a why." };
  if (typeof toEmployeeId !== "string" || toEmployeeId === m.id) return { error: "You can't send kudos to yourself." };
  if (!Number.isInteger(amount) || amount <= 0 || amount > m.kudosMonthlyAllowance) return { error: "Pick a valid amount." };

  const recipient = await prisma.employeeProfile.findFirst({ where: { id: toEmployeeId, companyId: m.companyId }, select: { id: true } });
  if (!recipient) return { error: "Pick a colleague from your company." };

  try {
    await prisma.$transaction(async (tx) => {
      // Recompute the monthly allowance INSIDE the txn so concurrent gifts can't overspend it.
      const agg = await tx.coinTxn.aggregate({
        where: { fromEmployeeId: m.id, kind: "KUDOS", createdAt: { gte: monthStart() } },
        _sum: { amount: true },
      });
      const remaining = m.kudosMonthlyAllowance - (agg._sum.amount ?? 0);
      if (amount > remaining) throw new Error(`OVER:${Math.max(0, remaining)}`);
      await tx.coinTxn.create({ data: { companyId: m.companyId, kind: "KUDOS", fromEmployeeId: m.id, toEmployeeId, amount, memo: reason } });
      await tx.employeeProfile.update({ where: { id: toEmployeeId }, data: { recognitionCoins: { increment: amount } } });
    });
  } catch (e) {
    const msg = (e as Error)?.message ?? "";
    if (msg.startsWith("OVER:")) return { error: `You only have ${msg.slice(5)} coins left to give this month.` };
    console.error("[giveKudos]", e);
    return { error: "Could not send kudos — try again." };
  }

  revalidatePath("/dashboard/recognition");
  return {};
}

/** HR mints coins to an employee — a company award, not drawn from anyone's allowance. */
export async function grantCoins(toEmployeeId: string, amount: number, memo: string): Promise<{ error?: string }> {
  const m = await requireCompanyAdmin();
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_GRANT) return { error: "Pick a valid amount." };

  const recipient = await prisma.employeeProfile.findFirst({ where: { id: toEmployeeId, companyId: m.companyId }, select: { id: true } });
  if (!recipient) return { error: "Pick a colleague from your company." };

  await prisma.$transaction([
    prisma.coinTxn.create({
      data: { companyId: m.companyId, kind: "GRANT", fromEmployeeId: null, toEmployeeId, amount, memo: memo.trim().slice(0, 280) || "Company award" },
    }),
    prisma.employeeProfile.update({ where: { id: toEmployeeId }, data: { recognitionCoins: { increment: amount } } }),
  ]);

  revalidatePath("/dashboard/recognition");
  return {};
}
