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
const CAT_LABEL: Record<string, string> = {
  wellness: "Wellness", fitness: "Fitness", food: "Foodie", health: "Health",
  travel: "Travel", learning: "Learning", culture: "Culture", telecom: "Telecom",
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

  /* ──────────────────────────  FAILURE scene (REJECTED)  ────────────────────────── */
  if (pkg.status === "REJECTED") {
    return (
      <main className="mx-auto flex min-h-[78vh] max-w-md flex-col items-center justify-center px-7 text-center">
        <Mascot mood="low" size={150} className="float" />
        <h1 className="mt-6 font-display text-[26px] font-extrabold tracking-[-.02em]">This pack was declined</h1>
        <p className="mt-2 max-w-[290px] text-muted">HR didn&apos;t approve {pkg.label} this time — <b>no coins were spent</b>. Take the Pulse again for a fresh set that fits.</p>
        <div className="waitline mt-6" style={{ background: "#FBE4DC", color: "var(--coral-deep)" }}>
          <Icon name="x" size={15} /> Not approved
        </div>
        <Link href="/dashboard/employee/pulse" className="btn btn-primary btn-lg mt-7 w-[260px]">Retake the Pulse →</Link>
        <Link href="/dashboard/employee" className="mt-3 text-sm font-semibold text-muted">Back to home</Link>
      </main>
    );
  }

  /* ──────────────────────────  PENDING scene (design 15)  ────────────────────────── */
  if (pkg.status === "PENDING") {
    return (
      <main className="mx-auto flex min-h-[78vh] max-w-md flex-col items-center justify-center px-7 text-center">
        <Mascot mood="thinking" size={170} className="float" />
        <h1 className="mt-6 font-display text-[26px] font-extrabold tracking-[-.02em]">Sent to TeamSystem<br />for approval</h1>
        <p className="mt-2 max-w-[280px] text-muted">Your HR usually approves in minutes. We&apos;ll ping you the second it&apos;s funded.</p>
        <div className="waitline mt-6">
          <span className="pulse-dot inline-block size-2 rounded-full bg-current" /> Waiting for approval
        </div>
        <div className="card mt-7 w-full text-left">
          <div className="kicker mb-2">Your pack</div>
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold">{pkg.label}</div>
            <span className="amt"><Coins amount={toCoins(pkg.totalLek)} /></span>
          </div>
          <div className="mt-1 text-sm text-muted">{items.length} providers{taxFree ? " · tax-free" : ""}</div>
        </div>
        <Link href="/dashboard/employee" className="mt-4 text-sm font-semibold text-muted">Back to home</Link>
      </main>
    );
  }

  /* ──────────────────────────  SUCCESS scene (design 16)  ────────────────────────── */
  if (pkg.status === "APPROVED") {
    const vouchers = await prisma.order.findMany({ where: { packageId: pkg.id }, select: { title: true, code: true } });
    const coinsEarned = toCoins(pkg.totalLek);
    const streak = await prisma.perkPackage.count({ where: { employeeProfileId: m.id, status: "APPROVED" } });
    const firstCat = items[0]?.category ?? "wellness";

    return (
      <main className="mx-auto max-w-md px-6 py-7 text-center" style={{ background: "radial-gradient(120% 40% at 50% 0%, #EEF6C9 0%, transparent 52%)" }}>
        <div className="check mx-auto"><Icon name="check" size={38} /></div>
        <h1 className="mt-3.5 font-display text-[28px] font-extrabold tracking-[-.02em]">Your week is ready!</h1>
        <div className="mt-1.5 text-muted">TeamSystem funded your {pkg.label}.</div>

        {/* payment split — instantly funded */}
        <div className="mt-6 text-left">
          <div className="kicker mb-2.5">Payment split — instantly funded</div>
          {items.map((o, i) => (
            <div key={o.id} className="flow fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className="amt"><Coins amount={toCoins(o.effLek)} /></span>
              <span className="arrow">→</span>
              <span className="to">{o.providerName}</span>
            </div>
          ))}
        </div>

        {/* rewards earned */}
        <div className="rewards mt-5">
          <div className="reward"><div className="big">+{coinsEarned}</div><div className="text-xs text-white/60">PerxCoin earned</div></div>
          <div className="reward"><div className="big">{streak} {streak === 1 ? "wk" : "wks"}</div><div className="text-xs text-white/60">Pulse streak</div></div>
        </div>

        {/* stamp unlocked */}
        <div className="stampwin mt-3.5">
          <span className="grid size-[54px] shrink-0 place-items-center rounded-full bg-white/20 text-white"><Icon name={CAT_ICON[firstCat] ?? "gift"} size={24} /></span>
          <div className="text-left">
            <div className="font-extrabold">New award unlocked!</div>
            <div className="text-[13px] text-white/90">{CAT_LABEL[firstCat] ?? "Wellness"} — view in Passport</div>
          </div>
        </div>

        {/* voucher codes */}
        {vouchers.length > 0 && (
          <div className="mt-5 text-left">
            <div className="kicker mb-2.5">Your voucher codes</div>
            <div className="space-y-2.5">
              {vouchers.map((v) => (
                <div key={v.code} className="row mb-0">
                  <span className="ico coral"><Icon name="ticket" size={20} /></span>
                  <div className="grow"><div className="t truncate">{v.title}</div></div>
                  <span className="code shrink-0 text-[15px] tracking-[.14em] text-coral-deep">{v.code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/dashboard/employee/wallet" className="btn btn-primary btn-lg mt-6">Open my wallet →</Link>
      </main>
    );
  }

  /* ──────────────────────────  DRAFT — the pack detail (design 13)  ────────────────────────── */
  const budgetLek = m.perksBudgetLek || pkg.totalLek;
  const afterLek = Math.max(0, budgetLek - pkg.totalLek);
  const ringPct = Math.min(100, Math.round((pkg.totalLek / Math.max(1, budgetLek)) * 100));

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      <div className="pack">
        <div className="pack-top coral">
          <div className="kk">{items.length} providers · your pack</div>
          <h2>{pkg.label}</h2>
        </div>
      </div>

      {pkg.rationale && (
        <div className="why" style={{ margin: "16px 2px" }}>
          <span className="spark"><Icon name="sparkles" size={16} /></span>
          <span className="text-sm text-muted">{pkg.rationale}</span>
        </div>
      )}

      <div style={{ background: "var(--cream-2)", border: "1px solid var(--paper-line)", borderRadius: "var(--r-lg)", padding: "4px 16px 8px" }}>
        {items.map((o, i) => (
          <div key={o.id} className="item" style={i === items.length - 1 ? { borderBottom: "none" } : undefined}>
            <span className="logo"><Icon name={CAT_ICON[o.category] ?? "gift"} size={20} /></span>
            <div className="grow">
              <div className="t">{o.providerName}</div>
              <div className="s">{o.title}{o.area ? ` · ${o.area}` : ""}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="pr"><Coins amount={toCoins(o.effLek)} /></div>
              <SwapButton packageId={pkg.id} offerId={o.id} />
            </div>
          </div>
        ))}
      </div>

      <div className="impact">
        <div className="ring" style={{ "--p": ringPct, "--size": "96px" } as React.CSSProperties}>
          <div className="ring-c"><b>{toCoins(afterLek).toLocaleString("en-US")}</b><span>after this</span></div>
        </div>
        <div>
          <div style={{ fontSize: "13px", color: "#fff9" }}>Budget ring impact</div>
          <div style={{ fontFamily: "var(--f-display)", fontSize: "22px", fontWeight: 700, margin: "3px 0" }}>
            <Coins amount={toCoins(pkg.totalLek)} />
          </div>
          {taxFree
            ? <span className="badge badge-tax">TAX-FREE · 0 tax</span>
            : <span style={{ fontSize: "12px", color: "#fff9" }}>Mixed tax · HR sees the breakdown</span>}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        The money never passes through your hands — TeamSystem funds each provider directly.
      </p>

      <form action={submitPackage.bind(null, pkg.id)} className="mt-2">
        <button type="submit" className="btn btn-primary btn-lg">Choose this week →</button>
      </form>
    </main>
  );
}
