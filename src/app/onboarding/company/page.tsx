import { redirect } from "next/navigation";
import { getAccount } from "@/lib/account";
import { CompanyWizard } from "./CompanyWizard";

export const dynamic = "force-dynamic";

export default async function CompanyOnboarding() {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (account.onboardingComplete) redirect("/dashboard");
  if (account.invitedToCompanyId) redirect("/onboarding/employee");
  if (account.accountType === "provider") redirect("/onboarding/provider");
  return <CompanyWizard />;
}
