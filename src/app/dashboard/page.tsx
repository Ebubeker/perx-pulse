import { redirect } from "next/navigation";
import { getAccount, getMembership } from "@/lib/account";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (!account.onboardingComplete) redirect("/onboarding");

  if (account.accountType === "provider") redirect("/dashboard/provider");

  const membership = await getMembership();
  if (membership?.role === "EMPLOYEE") redirect("/dashboard/employee");
  redirect("/dashboard/company");
}
