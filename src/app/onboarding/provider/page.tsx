import { redirect } from "next/navigation";
import { getAccount } from "@/lib/account";
import { ProviderWizard } from "./ProviderWizard";

export const dynamic = "force-dynamic";

export default async function ProviderOnboarding() {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (account.onboardingComplete) redirect("/dashboard");
  if (account.invitedToCompanyId) redirect("/onboarding/employee");
  if (account.accountType === "company") redirect("/onboarding/company");
  return <ProviderWizard />;
}
