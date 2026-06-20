import { redirect } from "next/navigation";
import { getAccount } from "@/lib/account";
import { chooseAccountType } from "@/lib/onboarding-actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (account.onboardingComplete) redirect("/dashboard");
  if (account.invitedToCompanyId) redirect("/onboarding/employee");
  if (account.accountType) redirect(`/onboarding/${account.accountType}`);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome to Perx Pulse</h1>
        <p className="text-muted">Set up your account. Employees are added later by their company.</p>
      </div>
      <div className="flex flex-col gap-3">
        <form action={chooseAccountType.bind(null, "company")}>
          <button type="submit" className="w-full rounded-lg border border-line bg-paper p-4 text-left transition hover:border-primary">
            <span className="block font-semibold">We&apos;re a company</span>
            <span className="block text-sm text-muted">Fund and manage benefits for your team</span>
          </button>
        </form>
        <form action={chooseAccountType.bind(null, "provider")}>
          <button type="submit" className="w-full rounded-lg border border-line bg-paper p-4 text-left transition hover:border-primary">
            <span className="block font-semibold">We&apos;re a provider</span>
            <span className="block text-sm text-muted">List your offers on the marketplace</span>
          </button>
        </form>
      </div>
    </main>
  );
}
