import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { Mascot } from "@/components/Mascot";

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage() {
  const m = await requireCompanyAdmin();
  const active = m.company.billingStatus === "active";

  return (
    <main className="mx-auto max-w-md px-4 py-12 text-center">
      <div className="flex justify-center">
        <Mascot mood={active ? "celebrate" : "thinking"} size={120} className="float" />
      </div>
      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">{active ? "You're on Perx!" : "Payment received"}</h1>
      <p className="mt-2 text-sm text-muted">
        {active
          ? "Your company plan is active. Time to build some great weeks."
          : "We're confirming your payment — your plan activates within a few seconds of Lemon Squeezy notifying us."}
      </p>
      <Link href="/dashboard/company/billing" className="btn btn-primary btn-lg mt-7">
        Back to billing
      </Link>
    </main>
  );
}
