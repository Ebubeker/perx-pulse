import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { Mascot } from "@/components/Mascot";

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage() {
  const m = await requireCompanyAdmin();
  const active = m.company.billingStatus === "active";

  return (
    <main className="page">
      <div className="mx-auto max-w-xl text-center">
        <div className="flex justify-center">
          <Mascot mood={active ? "celebrate" : "thinking"} size={140} className="float" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          {active ? "You're on Perx!" : "Payment received"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          {active
            ? "Your company plan is active. Time to build some great weeks."
            : "We're confirming your payment — your plan activates within a few seconds of Lemon Squeezy notifying us."}
        </p>
        <Link href="/dashboard/company/billing" className="btn btn-primary btn-lg mt-8 mx-auto max-w-xs">
          Back to billing
        </Link>
      </div>
    </main>
  );
}
