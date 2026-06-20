"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireMembership, requireCompanyAdmin } from "./account";
import { kudosRemainingFor } from "./coins";

/** Employee recognizes a colleague — draws from the giver's monthly allowance, credits the receiver's balance. */
export async function giveKudos(toEmployeeId: string, amount: number, memo: string): Promise<{ error?: string }> {
  const m = await requireMembership();
  const reason = memo.trim();
  if (!reason) return { error: "Add a reason — recognition lands better with a why." };
  if (toEmployeeId === m.id) return { error: "You can't send kudos to yourself." };
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Pick an amount." };

  const recipient = await prisma.employeeProfile.findFirst({ where: { id: toEmployeeId, companyId: m.companyId } });
  if (!recipient) return { error: "Pick a colleague from your company." };

  const remaining = await kudosRemainingFor(m.id, m.kudosMonthlyAllowance);
  if (amount > remaining) return { error: `You only have ${remaining} coins left to give this month.` };

  await prisma.$transaction([
    prisma.coinTxn.create({
      data: { companyId: m.companyId, kind: "KUDOS", fromEmployeeId: m.id, toEmployeeId, amount, memo: reason },
    }),
    prisma.employeeProfile.update({ where: { id: toEmployeeId }, data: { recognitionCoins: { increment: amount } } }),
  ]);

  revalidatePath("/dashboard/recognition");
  return {};
}

/** HR mints coins to an employee — a company award, not drawn from anyone's allowance. */
export async function grantCoins(toEmployeeId: string, amount: number, memo: string): Promise<{ error?: string }> {
  const m = await requireCompanyAdmin();
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Pick an amount." };

  const recipient = await prisma.employeeProfile.findFirst({ where: { id: toEmployeeId, companyId: m.companyId } });
  if (!recipient) return { error: "Pick a colleague from your company." };

  await prisma.$transaction([
    prisma.coinTxn.create({
      data: { companyId: m.companyId, kind: "GRANT", fromEmployeeId: null, toEmployeeId, amount, memo: memo.trim() || "Company award" },
    }),
    prisma.employeeProfile.update({ where: { id: toEmployeeId }, data: { recognitionCoins: { increment: amount } } }),
  ]);

  revalidatePath("/dashboard/recognition");
  return {};
}
