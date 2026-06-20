"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireCompanyAdmin } from "./account";
import { splitFor, voucherCode } from "./payments";
import { effectiveLek, toCoins } from "./currency";

class ApproveError extends Error {}

/**
 * HR approves a pending package. The employee's PerxCoins are spent, and the cash
 * equivalent is split across the providers behind each offer (Perx records its take-rate).
 */
export async function approvePackage(packageId: string): Promise<{ error?: string }> {
  const m = await requireCompanyAdmin();

  const pkg = await prisma.perkPackage.findFirst({
    where: { id: packageId, companyId: m.companyId, status: "PENDING" },
    include: { employee: { select: { id: true, displayName: true, recognitionCoins: true } } },
  });
  if (!pkg) redirect("/dashboard/company/approvals");

  // Resolve the offers behind the pack to the providers that get paid (effective/discounted price).
  const offers = await prisma.offer.findMany({
    where: { id: { in: pkg.itemOfferIds } },
    include: { provider: { select: { id: true, takeRatePct: true } } },
  });
  const byId = new Map(offers.map((o) => [o.id, o] as const));

  const orderData = pkg.itemOfferIds
    .map((id) => byId.get(id))
    .filter((o): o is NonNullable<typeof o> => !!o)
    .map((o) => {
      const gross = effectiveLek(o.priceLek, o.discountPct);
      const { feeLek, netLek } = splitFor(gross, o.provider.takeRatePct);
      return {
        packageId: pkg.id,
        companyId: pkg.companyId,
        providerId: o.provider.id,
        offerId: o.id,
        employeeProfileId: pkg.employeeProfileId,
        title: o.title,
        grossLek: gross,
        takeRatePct: o.provider.takeRatePct,
        feeLek,
        netLek,
        code: voucherCode(),
      };
    });

  // Spend = the actual settled (effective) total, so the debit matches what providers receive.
  const costCoins = toCoins(orderData.reduce((s, o) => s + o.grossLek, 0));
  if (pkg.employee.recognitionCoins < costCoins) {
    return { error: `${pkg.employee.displayName} needs ${costCoins} coins but has ${pkg.employee.recognitionCoins}.` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Only one approval wins the PENDING→APPROVED flip (defeats double-approve / double-spend).
      const flip = await tx.perkPackage.updateMany({
        where: { id: pkg.id, status: "PENDING" },
        data: { status: "APPROVED", decidedByClerkUserId: m.clerkUserId, decidedAt: new Date() },
      });
      if (flip.count === 0) return; // a concurrent approval already settled it — nothing to do

      // Atomic coin debit — fails (rolls the flip back) if the wallet can't cover it.
      const debit = await tx.$executeRaw`UPDATE "perx"."EmployeeProfile" SET "recognitionCoins" = "recognitionCoins" - ${costCoins}
        WHERE "id" = ${pkg.employeeProfileId} AND "recognitionCoins" >= ${costCoins}`;
      if (debit === 0) throw new ApproveError("NO_FUNDS");

      await tx.order.createMany({ data: orderData });
      // Record the spend on the personal ledger so it shows in the employee's coin history.
      await tx.coinTxn.create({
        data: { companyId: pkg.companyId, kind: "SPEND", fromEmployeeId: pkg.employeeProfileId, toEmployeeId: null, amount: costCoins, memo: pkg.label },
      });
    });
  } catch (e) {
    if (e instanceof ApproveError) {
      return { error: `${pkg.employee.displayName} needs ${costCoins} coins but has ${pkg.employee.recognitionCoins}.` };
    }
    console.error("[approvePackage]", e);
    return { error: "Could not approve — try again." };
  }

  revalidatePath("/dashboard/company/approvals");
  redirect(`/dashboard/company/approvals/${pkg.id}`);
}

/** HR declines a pending package. */
export async function rejectPackage(packageId: string): Promise<void> {
  const m = await requireCompanyAdmin();
  await prisma.perkPackage.updateMany({
    where: { id: packageId, companyId: m.companyId, status: "PENDING" },
    data: { status: "REJECTED", decidedByClerkUserId: m.clerkUserId, decidedAt: new Date() },
  });
  revalidatePath("/dashboard/company/approvals");
}

/** Provider marks a paid order as redeemed (employee showed up / used the voucher). */
export async function markRedeemed(orderId: string): Promise<void> {
  const { requireProvider } = await import("./account");
  const provider = await requireProvider();
  await prisma.order.updateMany({
    where: { id: orderId, providerId: provider.id, status: "PAID" },
    data: { status: "REDEEMED", redeemedAt: new Date() },
  });
  revalidatePath("/dashboard/provider");
}
