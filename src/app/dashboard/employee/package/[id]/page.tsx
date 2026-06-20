import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { resolveOffers } from "@/lib/gemini";
import { submitPackage } from "@/lib/pulse-actions";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Icon, type IconName } from "@/components/Icon";
import { Mascot } from "@/components/Mascot";
import { SwapButton } from "./SwapButton";

export const dynamic = "force-dynamic";

const CAT_ICON: Record<string, IconName> = {
  wellness: "wellness", fitness: "fitness", food: "food", health: "health",
  travel: "travel", learning: "learning", culture: "culture", telecom: "telecom",
};

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
  const isApproved = pkg.status === "APPROVED";
  const vouchers = isApproved
    ? await prisma.order.findMany({ where: { packageId: pkg.id }, select: { title: true, code: true } })
    : [];

  // hero colour follows status: approved → lime celebration, otherwise coral.
  const topClass = isApproved ? "lime" : "coral";

  const STATUS_PILL: Record<string, { cls: string; label: string; pulse: boolean }> = {
    DRAFT: { cls: "pill-redeemed", label: "Draft", pulse: false },
    PENDING: { cls: "pill-pending", label: "Waiting for approval", pulse: true },
    APPROVED: { cls: "pill-ready", label: "Funded & ready", pulse: false },
    REJECTED: { cls: "pill-redeemed", label: "Declined", pulse: false },
  };
  const pill = STATUS_PILL[pkg.status] ?? STATUS_PILL.DRAFT!;

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* ── Pack hero ── */}
      <div className="pack">
        <div className={`pack-top ${topClass}`}>
          <div className="kk">{items.length} providers · {taxFree ? "tax-free" : "your pack"}</div>
          <h2>{pkg.label}</h2>
        </div>
      </div>

      {/* why this pack */}
      {pkg.rationale && (
        <div className="mx-0.5 my-4 flex gap-2.5 text-sm leading-snug">
          <span className="shrink-0"><Icon name="sparkles" size={16} className="text-coral" /></span>
          <span className="text-muted">{pkg.rationale}</span>
        </div>
      )}

      {/* ── Item list ── */}
      <div className="rounded-[var(--r-lg)] border border-line bg-paper px-4 pb-2 pt-1">
        {items.map((o, i) => (
          <div
            key={o.id}
            className={`flex items-center gap-3 py-3.5 ${i < items.length - 1 ? "border-b border-line" : ""}`}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-coral-soft text-coral-deep">
              <Icon name={CAT_ICON[o.category] ?? "gift"} size={20} />
            </span>
            <div className="min-w-0 grow">
              <div className="truncate font-bold">{o.title}</div>
              <div className="truncate text-[12.5px] text-muted">{o.providerName}{o.area ? ` · ${o.area}` : ""}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="font-display font-bold"><Coins amount={toCoins(o.effLek)} /></span>
              {isDraft && <SwapButton packageId={pkg.id} offerId={o.id} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Total impact card (dark) ── */}
      <div className="card-dark mt-4 flex items-center gap-4">
        <div className="blob" />
        <Mascot mood="holding" size={84} className="relative z-[2] float shrink-0" />
        <div className="relative z-[2]">
          <div className="text-[13px] text-[var(--txt-on-dark-mut)]">Total · spent from your coins</div>
          <div className="my-0.5 font-display text-[22px] font-bold text-[var(--txt-on-dark)]">
            <Coins amount={toCoins(pkg.totalLek)} />
          </div>
          {taxFree
            ? <span className="badge badge-tax">Tax-free · 0 tax</span>
            : <span className="text-xs text-[var(--txt-on-dark-mut)]">Mixed tax treatment — HR sees the breakdown</span>}
        </div>
      </div>

      {/* status line under the total */}
      <div className="mt-4 flex justify-center">
        <span className={`pill ${pill.cls}`}>
          <span className={`dot ${pill.pulse ? "pulse-dot" : ""}`} />{pill.label}
        </span>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        The money never passes through your hands — TeamSystem funds each provider directly.
      </p>

      {/* ── DRAFT: submit ── */}
      {isDraft && (
        <form action={submitPackage.bind(null, pkg.id)} className="mt-5">
          <button type="submit" className="btn btn-primary btn-lg">Choose this week →</button>
        </form>
      )}

      {/* ── PENDING: sent to HR ── */}
      {pkg.status === "PENDING" && (
        <div className="mt-7 flex flex-col items-center px-2 text-center">
          <Mascot mood="thinking" size={140} className="float" />
          <h1 className="mt-5 font-display text-[22px] font-extrabold tracking-tight">
            Sent to TeamSystem<br />for approval
          </h1>
          <p className="mt-2 max-w-[280px] text-sm text-muted">
            Your HR usually approves in minutes. We&apos;ll ping you the second it&apos;s funded.
          </p>
        </div>
      )}

      {/* ── APPROVED: celebration + payment split + vouchers ── */}
      {isApproved && (
        <div className="mt-7">
          <div className="flex flex-col items-center text-center">
            <Mascot mood="celebrate" size={130} className="float" />
            <h1 className="mt-4 font-display text-[24px] font-extrabold tracking-tight">Your week is ready!</h1>
            <p className="mt-1.5 text-sm text-muted">TeamSystem funded your {pkg.label}.</p>
          </div>

          {/* instant payment split */}
          <div className="sec"><h3>Payment split</h3><span className="link">instantly funded</span></div>
          <div className="space-y-2.5">
            {items.map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-[var(--r-md)] border border-line bg-cream px-4 py-3 fade-up">
                <span className="font-display font-bold text-coral"><Coins amount={toCoins(o.effLek)} /></span>
                <span className="text-muted">→</span>
                <span className="min-w-0 grow truncate font-bold">{o.providerName}</span>
              </div>
            ))}
          </div>

          {/* vouchers to redeem */}
          {vouchers.length > 0 && (
            <>
              <div className="sec"><h3>Vouchers</h3></div>
              <div className="space-y-2.5">
                {vouchers.map((v) => (
                  <div key={v.code} className="row mb-0">
                    <span className="ico coral"><Icon name="ticket" size={20} /></span>
                    <div className="grow"><div className="t truncate">{v.title}</div></div>
                    <span className="shrink-0 rounded-lg bg-cream px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-ink">{v.code}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Link href="/dashboard/employee/wallet" className="btn btn-primary btn-lg mt-6">Open my wallet →</Link>
        </div>
      )}

      {/* ── REJECTED ── */}
      {pkg.status === "REJECTED" && (
        <div className="card mt-7 flex items-center gap-4">
          <Mascot mood="low" size={58} className="float shrink-0" />
          <div>
            <div className="font-display text-base font-bold">This pack was declined</div>
            <div className="text-sm text-muted">No worries — take the Pulse again for a fresh set that fits.</div>
          </div>
        </div>
      )}
    </main>
  );
}
