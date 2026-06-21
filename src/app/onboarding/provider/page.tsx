import { redirect } from "next/navigation";
import { getAccount, getProvider } from "@/lib/account";
import { ProviderWizard } from "./ProviderWizard";

export const dynamic = "force-dynamic";

export default async function ProviderOnboarding() {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (account.invitedToCompanyId) redirect("/onboarding/employee");

  // Already a provider — nothing to add; go straight to the provider workspace.
  const provider = await getProvider();
  if (provider) redirect("/dashboard/provider");

  // Allowed here: a fresh provider signup, OR an already-onboarded company/employee
  // adding the provider hat. A user still picking their initial type goes back.
  const isFreshProvider = account.accountType === "provider";
  if (!isFreshProvider && !account.onboardingComplete) redirect("/onboarding");

  return <ProviderWizard />;
}
