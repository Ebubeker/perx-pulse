"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireCompanyAdmin } from "./account";
import { monthStart } from "./coins";

const MAX_TOPUP = 1_000_000; // coins per top-up

/**
 * The company buys PerxCoins into its treasury — 1 coin = 100 Lek. This is the only place
 * coins enter the economy: every spread and award is later drawn FROM this purchased pool,
 * so the coin supply is always backed by real money the company paid (no minting from thin air).
 */
export async function topUpTreasury(coins: number): Promise<{ error?: string; ok?: boolean; balance?: number }> {
  const m = await requireCompanyAdmin();
  if (!Number.isInteger(coins) || coins <= 0) return { error: "Enter how many coins to buy." };
  if (coins > MAX_TOPUP) return { error: "That top-up is too large — split it into smaller batches." };
  const lek = coins * 100;

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.company.update({
      where: { id: m.companyId },
      data: { treasuryCoins: { increment: coins } },
      select: { treasuryCoins: true },
    });
    await tx.coinTxn.create({ data: { companyId: m.companyId, kind: "TOPUP", amount: coins, memo: `Top-up · ${lek.toLocaleString("en-US")} Lek` } });
    return c;
  });

  revalidatePath("/dashboard/recognition");
  revalidatePath("/dashboard/company/billing");
  revalidatePath("/dashboard/company");
  return { ok: true, balance: updated.treasuryCoins };
}

/**
 * Distribute this month's spread: every employee receives `monthlySpreadCoins`, drawn from the
 * treasury. Idempotent per calendar month and guarded so it can never overdraw the treasury.
 */
export async function distributeMonthlySpread(): Promise<{ error?: string; ok?: boolean; count?: number; total?: number }> {
  const m = await requireCompanyAdmin();
  const company = await prisma.company.findUnique({ where: { id: m.companyId }, select: { monthlySpreadCoins: true } });
  if (!company) return { error: "Company not found." };
  const spread = company.monthlySpreadCoins;
  if (spread <= 0) return { error: "Set a monthly spread first in Settings." };

  const employees = await prisma.employeeProfile.findMany({ where: { companyId: m.companyId, role: "EMPLOYEE" }, select: { id: true } });
  if (employees.length === 0) return { error: "No employees to distribute to yet." };

  // Once per calendar month — the marker is the "Monthly allowance" GRANT memo.
  const already = await prisma.coinTxn.findFirst({
    where: { companyId: m.companyId, kind: "GRANT", memo: "Monthly allowance", createdAt: { gte: monthStart() } },
    select: { id: true },
  });
  if (already) return { error: "This month's allowance is already distributed." };

  const total = spread * employees.length;
  try {
    await prisma.$transaction(async (tx) => {
      // Atomic, guarded treasury debit — can never go negative even under concurrent clicks.
      const debit = await tx.$executeRaw`UPDATE "perx"."Company" SET "treasuryCoins" = "treasuryCoins" - ${total}
        WHERE "id" = ${m.companyId} AND "treasuryCoins" >= ${total}`;
      if (debit === 0) throw new Error("NO_TREASURY");
      for (const e of employees) {
        await tx.employeeProfile.update({ where: { id: e.id }, data: { recognitionCoins: { increment: spread } } });
        await tx.coinTxn.create({ data: { companyId: m.companyId, kind: "GRANT", toEmployeeId: e.id, amount: spread, memo: "Monthly allowance" } });
      }
    });
  } catch (e) {
    if ((e as Error)?.message === "NO_TREASURY") {
      return { error: `Top up first — you need ${total.toLocaleString("en-US")} coins to cover ${employees.length} ${employees.length === 1 ? "employee" : "employees"}.` };
    }
    console.error("[distributeMonthlySpread]", e);
    return { error: "Could not distribute — try again." };
  }

  revalidatePath("/dashboard/recognition");
  revalidatePath("/dashboard/employee");
  return { ok: true, count: employees.length, total };
}
