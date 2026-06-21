"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireCompanyAdmin } from "./account";
import { prisma } from "./prisma";
import { createCheckout, billingConfigured } from "./billing";
import { subscriptionMonthlyUsd } from "./pricing";

/** Start a real Lemon Squeezy test checkout for the admin's company, then redirect to it. */
export async function startCheckout(): Promise<{ error?: string }> {
  const m = await requireCompanyAdmin();
  if (!billingConfigured()) return { error: "Billing is not configured." };

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress || m.company.billingContactEmail || "";
  if (!email) return { error: "No billing email on file." };

  // Dynamic, seat-based monthly price (USD cents) — scales with headcount.
  const memberCount = await prisma.employeeProfile.count({ where: { companyId: m.companyId } });
  const customPriceCents = subscriptionMonthlyUsd(memberCount) * 100;

  let url: string;
  try {
    url = await createCheckout({ companyId: m.companyId, email, name: m.company.name, customPriceCents });
  } catch (e) {
    console.error("[billing] checkout error:", (e as Error).message);
    return { error: "Could not start checkout. Try again." };
  }
  redirect(url); // external redirect to Lemon's hosted checkout
}
