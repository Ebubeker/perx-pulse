import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage() {
  const m = await requireCompanyAdmin();
  const active = m.company.billingStatus === "active";

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="text-5xl">{active ? "🎉" : "⏳"}</div>
      <h1 className="mt-4 text-2xl font-bold">{active ? "You're on Perx!" : "Payment received"}</h1>
      <p className="mt-2 text-sm text-muted">
        {active
          ? "Your company plan is active. Time to build some great weeks."
          : "We're confirming your payment — your plan activates within a few seconds of Lemon Squeezy notifying us."}
      </p>
      <Link href="/dashboard/company/billing" className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-white">
        Back to billing
      </Link>
    </main>
  );
}
