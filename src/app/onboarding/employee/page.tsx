import { redirect } from "next/navigation";
import { getAccount } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { EmployeeWizard } from "./EmployeeWizard";

export const dynamic = "force-dynamic";

export default async function EmployeeOnboarding() {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (account.onboardingComplete) redirect("/dashboard");
  if (!account.invitedToCompanyId) redirect("/onboarding");

  const company = await prisma.company.findUnique({
    where: { id: account.invitedToCompanyId },
    select: { name: true, brandName: true },
  });

  return <EmployeeWizard companyName={company?.brandName || company?.name || "your company"} />;
}
