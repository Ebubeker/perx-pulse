"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireMembership, requireCompanyAdmin } from "./account";

const MAX_GRANT = 100_000;

/**
 * Employee recognizes a colleague. Kudos are a TRANSFER from the giver's own wallet to the
 * receiver's — no coins are minted, so the company's coin supply is conserved. You can only
 * give what you actually hold.
 */
export async function giveKudos(toEmployeeId: string, amount: number, memo: string): Promise<{ error?: string }> {
  const m = await requireMembership();
  const reason = memo.trim().slice(0, 280);
  if (!reason) return { error: "Add a reason — recognition lands better with a why." };
  if (typeof toEmployeeId !== "string" || toEmployeeId === m.id) return { error: "You can't send kudos to yourself." };
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Pick a valid amount." };
  if (amount > m.recognitionCoins) return { error: `You only have ${m.recognitionCoins} coins in your wallet.` };

  const recipient = await prisma.employeeProfile.findFirst({ where: { id: toEmployeeId, companyId: m.companyId }, select: { id: true } });
  if (!recipient) return { error: "Pick a colleague from your company." };

  try {
    await prisma.$transaction(async (tx) => {
      // Atomic debit from the giver — conditional so concurrent gifts can never overdraw the wallet.
      const debit = await tx.$executeRaw`UPDATE "perx"."EmployeeProfile" SET "recognitionCoins" = "recognitionCoins" - ${amount}
        WHERE "id" = ${m.id} AND "recognitionCoins" >= ${amount}`;
      if (debit === 0) throw new Error("NO_FUNDS");
      await tx.employeeProfile.update({ where: { id: toEmployeeId }, data: { recognitionCoins: { increment: amount } } });
      await tx.coinTxn.create({ data: { companyId: m.companyId, kind: "KUDOS", fromEmployeeId: m.id, toEmployeeId, amount, memo: reason } });
    });
  } catch (e) {
    if ((e as Error)?.message === "NO_FUNDS") return { error: "Not enough coins in your wallet to send that." };
    console.error("[giveKudos]", e);
    return { error: "Could not send kudos — try again." };
  }

  revalidatePath("/dashboard/recognition");
  revalidatePath("/dashboard/employee");
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
