import { redirect } from "next/navigation";
import { getAccount, getWorkspaces, getActiveWorkspace, WS_HOME } from "@/lib/account";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (!account.onboardingComplete) redirect("/onboarding");

  const w = await getWorkspaces();
  if (!w || w.available.length === 0) redirect("/onboarding");

  const active = await getActiveWorkspace(w.available);
  redirect(WS_HOME[active!]);
}
