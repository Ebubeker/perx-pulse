import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { resolveOffers } from "@/lib/gemini";
import { submitPackage } from "@/lib/pulse-actions";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Icon } from "@/components/Icon";
import { Mascot } from "@/components/Mascot";
import { SwapButton } from "./SwapButton";

export const dynamic = "force-dynamic";

export default async function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const pkg = await prisma.perkPackage.findFirst({ where: { id, employeeProfileId: m.id } });
  if (!pkg) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center text-muted">
        Pack not found. <Link href="/dashboard/employee/discover" className="font-semibold text-coral underline">Back to discover</Link>
      </main>
    );
  }

  const items = await resolveOffers(pkg.itemOfferIds);
  const taxFree = items.length > 0 && items.every((o) => o.taxFree);
  const isDraft = pkg.status === "DRAFT";
  const vouchers = pkg.status === "APPROVED"
    ? await prisma.order.findMany({ where: { packageId: pkg.id }, select: { title: true, code: true } })
    : [];

  const STATUS_PILL: Record<string, { cls: string; label: string }> = {
    DRAFT: { cls: "pill-redeemed", label: "Draft" },
    PENDING: { cls: "pill-pending", label: "Pending HR" },
    APPROVED: { cls: "pill-approved", label: "Approved" },
    REJECTED: { cls: "pill-redeemed", label: "Declined" },
  };
  const pill = STATUS_PILL[pkg.status] ?? { cls: "pill-redeemed", label: "Draft" };

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* hero header */}
      <div className="pack">
        <div className={`pack-top ${pkg.status === "APPROVED" ? "lime" : "ink"}`}>
          <div className="kk">Your pack · {items.length} providers</div>
          <h2>{pkg.label}</h2>
        </div>
        <div className="pack-body">
          <div className="flex items-center gap-2">
            <span className={`pill ${pill.cls}`}>
              <span className={`dot ${pkg.status === "PENDING" ? "pulse-dot" : ""}`} />{pill.label}
            </span>
            {taxFree && <span className="badge badge-tax">Tax-free</span>}
          </div>
          {pkg.rationale && <p className="why mt-3"><span className="spark">✦</span><span>{pkg.rationale}</span></p>}
        </div>
      </div>

      {/* items */}
      <div className="mt-4 space-y-2.5">
        {items.map((o) => (
          <div key={o.id} className="row mb-0">
            <span className="ico coral">✦</span>
            <div className="grow">
              <div className="t truncate">{o.title}</div>
              <div className="s truncate">{o.providerName}{o.area ? ` · ${o.area}` : ""}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="amt"><Coins amount={toCoins(o.effLek)} /></span>
              {isDraft && <SwapButton packageId={pkg.id} offerId={o.id} />}
            </div>
          </div>
        ))}
      </div>

      {/* total */}
      <div className="card-dark mt-3">
        <div className="blob" />
        <div className="relative z-[2] flex items-center justify-between">
          <div>
            <div className="text-[13px] text-[var(--txt-on-dark-mut)]">Total · spent from your coins</div>
            <div className="mt-1 font-display text-2xl font-bold text-[var(--txt-on-dark)]"><Coins amount={toCoins(pkg.totalLek)} /></div>
          </div>
          <Mascot mood="holding" size={64} className="float" />
        </div>
      </div>

      <div className="card mt-3 text-sm text-ink-soft">
        {taxFree ? "All items are tax-free under welfare rules. " : "Mixed tax treatment — HR sees the breakdown. "}
        The money never passes through your hands.
      </div>

      {isDraft && (
        <form action={submitPackage.bind(null, pkg.id)} className="mt-5">
          <button type="submit" className="btn btn-primary btn-lg">Send to HR for approval →</button>
        </form>
      )}

      {pkg.status === "PENDING" && (
        <div className="card mt-5 flex items-center gap-4">
          <Mascot mood="thinking" size={58} className="float" />
          <div>
            <div className="font-display text-base font-bold">Sent to HR for approval</div>
            <div className="text-sm text-muted">Your HR usually approves in minutes — we&apos;ll ping you the second it&apos;s funded.</div>
          </div>
        </div>
      )}

      {pkg.status === "APPROVED" && (
        <div className="mt-5">
          <div className="card flex items-center gap-4 border-lime/40 bg-lime-soft">
            <Mascot mood="celebrate" size={58} className="float" />
            <div>
              <div className="font-display text-base font-bold">Approved — your week is ready!</div>
              <div className="text-sm text-ink-soft">Show these codes at each provider.</div>
            </div>
          </div>
          <div className="sec"><h3>Vouchers</h3></div>
          <div className="space-y-2.5">
            {vouchers.map((v) => (
              <div key={v.code} className="row mb-0">
                <span className="ico"><Icon name="ticket" size={20} /></span>
                <div className="grow"><div className="t truncate">{v.title}</div></div>
                <span className="shrink-0 rounded-lg bg-cream px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-ink">{v.code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pkg.status === "REJECTED" && (
        <div className="card mt-5 text-sm text-muted">This pack was declined by HR. Take the Pulse again for a fresh set.</div>
      )}
    </main>
  );
}
