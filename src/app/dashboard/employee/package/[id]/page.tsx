import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { resolveOffers } from "@/lib/gemini";
import { submitPackage } from "@/lib/pulse-actions";
import { SwapButton } from "./SwapButton";

export const dynamic = "force-dynamic";

export default async function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const pkg = await prisma.perkPackage.findFirst({ where: { id, employeeProfileId: m.id } });
  if (!pkg) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center text-muted">
        Pack not found. <Link href="/dashboard/employee/discover" className="text-primary underline">Back to discover</Link>
      </main>
    );
  }

  const items = await resolveOffers(pkg.itemOfferIds);
  const taxFree = items.length > 0 && items.every((o) => o.taxFree);
  const isDraft = pkg.status === "DRAFT";
  const vouchers = pkg.status === "APPROVED"
    ? await prisma.order.findMany({ where: { packageId: pkg.id }, select: { title: true, code: true } })
    : [];

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="text-sm font-semibold tracking-wide text-accent">YOUR PACK</p>
      <h1 className="mt-1 text-2xl font-bold">{pkg.label}</h1>
      <p className="mt-1 text-sm text-muted">{pkg.rationale}</p>

      <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-paper">
        {items.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{o.title}</p>
              <p className="truncate text-xs text-muted">{o.providerName}{o.area ? ` · ${o.area}` : ""}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-semibold text-ink-soft">{o.priceLek.toLocaleString("en-US")} L</span>
              {isDraft && <SwapButton packageId={pkg.id} offerId={o.id} />}
            </div>
          </li>
        ))}
        <li className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted">Total · paid by your employer</span>
          <span className="text-lg font-bold">{pkg.totalLek.toLocaleString("en-US")} L</span>
        </li>
      </ul>

      <div className="mt-4 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary">
        {taxFree ? "All items are tax-free under welfare rules. " : "Mixed tax treatment — HR sees the breakdown. "}
        The money never passes through your hands.
      </div>

      {isDraft && (
        <form action={submitPackage.bind(null, pkg.id)} className="mt-5">
          <button type="submit" className="w-full rounded-xl bg-primary py-4 text-[15px] font-semibold text-white">Send to HR for approval</button>
        </form>
      )}
      {pkg.status === "PENDING" && (
        <p className="mt-5 rounded-xl border border-line bg-paper px-4 py-3 text-sm">⏳ Sent to HR — awaiting approval.</p>
      )}
      {pkg.status === "APPROVED" && (
        <div className="mt-5">
          <p className="rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 text-sm text-primary">✓ Approved — show these codes at each provider.</p>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-paper">
            {vouchers.map((v) => (
              <li key={v.code} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-medium">{v.title}</span>
                <span className="shrink-0 rounded-lg bg-cream px-2.5 py-1 font-mono text-sm font-bold tracking-wide">{v.code}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pkg.status === "REJECTED" && (
        <p className="mt-5 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">This pack was declined by HR. Take the Pulse again for a fresh set.</p>
      )}
    </main>
  );
}
