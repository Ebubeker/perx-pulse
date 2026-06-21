import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { CompanySettingsForm } from "./CompanySettingsForm";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  const m = await requireCompanyAdmin();
  const c = m.company;
  const employeeCount = await prisma.employeeProfile.count({ where: { companyId: m.companyId, role: "EMPLOYEE" } });

  return (
    <main className="mx-auto max-w-md px-5 py-5 md:max-w-3xl md:px-8 md:py-7">
      <div className="greet">
        <div className="day">{c.brandName || c.name}</div>
        <h1>Settings</h1>
      </div>

      <CompanySettingsForm
        employeeCount={employeeCount}
        company={{
          name: c.name,
          brandName: c.brandName ?? "",
          logoUrl: c.logoUrl ?? "",
          industry: c.industry ?? "",
          website: c.website ?? "",
          addressLine: c.addressLine ?? "",
          city: c.city ?? "",
          monthlySpreadCoins: c.monthlySpreadCoins,
        }}
      />
    </main>
  );
}
