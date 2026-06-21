"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireCompanyAdmin } from "./account";

export interface CompanySettingsInput {
  name: string;
  brandName?: string;
  logoUrl?: string;
  industry?: string;
  website?: string;
  addressLine?: string;
  city?: string;
  monthlySpreadCoins: number; // coins each employee receives per month
}

/** Update the company profile + recognition program (monthly coin spread per employee). Admin only. */
export async function updateCompanySettings(input: CompanySettingsInput): Promise<{ ok?: boolean; error?: string }> {
  const m = await requireCompanyAdmin();

  const name = input.name.trim();
  if (name.length < 2) return { error: "Company name is required." };

  const spread = Math.round(input.monthlySpreadCoins);
  if (!Number.isFinite(spread) || spread < 0 || spread > 100_000) return { error: "Enter a valid monthly spread (0–100,000 coins)." };

  await prisma.company.update({
    where: { id: m.companyId },
    data: {
      name,
      brandName: input.brandName?.trim() || null,
      logoUrl: input.logoUrl?.trim() || null,
      industry: input.industry?.trim() || null,
      website: input.website?.trim() || null,
      addressLine: input.addressLine?.trim() || null,
      city: input.city?.trim() || null,
      monthlySpreadCoins: spread,
    },
  });

  revalidatePath("/dashboard/company/settings");
  revalidatePath("/dashboard/recognition");
  revalidatePath("/dashboard/company");
  return { ok: true };
}
