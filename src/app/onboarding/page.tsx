import { redirect } from "next/navigation";
import { getAccount } from "@/lib/account";
import { chooseAccountType } from "@/lib/onboarding-actions";
import { Mascot } from "@/components/Mascot";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (account.onboardingComplete) redirect("/dashboard");
  if (account.invitedToCompanyId) redirect("/onboarding/employee");
  if (account.accountType) redirect(`/onboarding/${account.accountType}`);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-cream px-6 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <Mascot mood="thinking" size={120} className="float" />
        <Logo className="mt-4" />
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">How will you use Perx?</h1>
        <p className="mt-2 text-muted">Set up your account. One tap — that&apos;s it.</p>
      </div>

      <div className="flex flex-col gap-3.5">
        <form action={chooseAccountType.bind(null, "company")}>
          <button type="submit" className="flex w-full items-center gap-4 rounded-[26px] border border-line bg-paper p-[18px] text-left shadow-soft transition active:scale-[.98]">
            <span className="grid size-[54px] shrink-0 place-items-center rounded-2xl bg-lime text-2xl text-ink">⌂</span>
            <span className="min-w-0">
              <span className="block font-display text-[21px] font-bold leading-tight">Employer / HR</span>
              <span className="block text-[13.5px] text-muted">Fund and manage benefits for your team</span>
            </span>
            <span className="ml-auto text-xl text-muted">›</span>
          </button>
        </form>
        <form action={chooseAccountType.bind(null, "provider")}>
          <button type="submit" className="flex w-full items-center gap-4 rounded-[26px] border border-line bg-paper p-[18px] text-left shadow-soft transition active:scale-[.98]">
            <span className="grid size-[54px] shrink-0 place-items-center rounded-2xl bg-coral text-2xl text-white">🛍</span>
            <span className="min-w-0">
              <span className="block font-display text-[21px] font-bold leading-tight">Provider</span>
              <span className="block text-[13.5px] text-muted">I offer services &amp; experiences</span>
            </span>
            <span className="ml-auto text-xl text-muted">›</span>
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-xs text-muted">Employees are added later by their company.</p>
    </main>
  );
}
