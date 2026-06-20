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

  // budget ring impact — coins left after funding this pack (design 13)
  const budgetLek = m.perksBudgetLek || pkg.totalLek;
  const afterLek = Math.max(0, budgetLek - pkg.totalLek);
  const ringPct = Math.min(100, Math.round((pkg.totalLek / Math.max(1, budgetLek)) * 100));

  // rewards earned on approval (design 16): coins back + Pulse streak
  const coinsEarned = toCoins(pkg.totalLek);
  const streak = isApproved
    ? await prisma.perkPackage.count({ where: { employeeProfileId: m.id, status: "APPROVED" } })
    : 0;

  // hero colour follows status: approved → lime celebration, otherwise coral.
  const topClass = isApproved ? "lime" : "coral";

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* ── Pack hero (design 13) ── */}
      <div className="pack">
        <div className={`pack-top ${topClass}`}>
          <div className="kk">{items.length} providers · {taxFree ? "tax-free" : "your pack"}</div>
          <h2>{pkg.label}</h2>
        </div>
      </div>

      {/* why this pack */}
      {pkg.rationale && (
        <div className="why" style={{ margin: "16px 2px" }}>
          <span className="spark"><Icon name="sparkles" size={16} /></span>
          <span className="muted" style={{ fontSize: "14px" }}>{pkg.rationale}</span>
        </div>
      )}

      {/* ── Item list (.item rows) ── */}
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
              {isDraft && <SwapButton packageId={pkg.id} offerId={o.id} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Budget-ring impact card (dark) ── */}
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
            : <span style={{ fontSize: "12px", color: "#fff9" }}>Mixed tax — HR sees the breakdown</span>}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        The money never passes through your hands — TeamSystem funds each provider directly.
      </p>

      {/* ── DRAFT: submit ── */}
      {isDraft && (
        <form action={submitPackage.bind(null, pkg.id)} className="cta mt-2" style={{ padding: 0 }}>
          <button type="submit" className="btn btn-primary btn-lg">Choose this week →</button>
        </form>
      )}

      {/* ── PENDING (design 15): waitline + thinking mascot ── */}
      {pkg.status === "PENDING" && (
        <div className="mt-7 flex flex-col items-center px-2 text-center">
          <Mascot mood="thinking" size={170} className="float" />
          <h1 className="mt-[22px] font-display text-[26px] font-extrabold tracking-[-.02em]">
            Sent to TeamSystem<br />for approval
          </h1>
          <p className="mt-2 max-w-[280px] text-muted">
            Your HR usually approves in minutes. We&apos;ll ping you the second it&apos;s funded.
          </p>
          <div className="waitline mt-[22px]">
            <span className="dot pulse-dot" style={{ width: "9px", height: "9px", borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
            Waiting for approval
          </div>
        </div>
      )}

      {/* ── APPROVED (design 16): check + payment split + rewards + stampwin + vouchers ── */}
      {isApproved && (
        <div className="mt-7 text-center">
          <div className="check mx-auto"><Icon name="check" size={38} /></div>
          <h1 className="mt-3.5 font-display text-[28px] font-extrabold tracking-[-.02em]">Your week is ready! 🎉</h1>
          <div className="mt-1.5 text-muted">TeamSystem funded your {pkg.label}.</div>

          {/* payment split — .flow rows */}
          <div className="text-left" style={{ marginTop: "22px" }}>
            <div className="kicker" style={{ marginBottom: "10px" }}>Payment split — instantly funded</div>
            {items.map((o, i) => (
              <div key={o.id} className="flow fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
                <span className="amt"><Coins amount={toCoins(o.effLek)} /></span>
                <span className="arrow">→</span>
                <span className="to">{o.providerName}</span>
              </div>
            ))}
          </div>

          {/* rewards — .reward tiles */}
          <div className="rewards mt-5">
            <div className="reward"><div className="big">+{coinsEarned}</div><div style={{ fontSize: "12px", color: "#fff9" }}>PerxCoin earned</div></div>
            <div className="reward"><div className="big">{streak} wks</div><div style={{ fontSize: "12px", color: "#fff9" }}>Pulse streak</div></div>
          </div>

          {/* stamp unlocked — .stampwin */}
          <div className="stampwin mt-3.5">
            <div className="stamp got" style={{ width: "54px", height: "54px", border: "none", background: "#ffffff22", padding: 0 }}>
              <div className="disc" style={{ background: "#fff", color: "var(--coral)" }}><Icon name="wellness" size={22} /></div>
            </div>
            <div>
              <div style={{ fontWeight: 800 }}>New stamp unlocked!</div>
              <div style={{ fontSize: "13px", color: "#fff", opacity: 0.9 }}>Wellness Starter — view in Passport</div>
            </div>
          </div>

          {/* vouchers to redeem */}
          {vouchers.length > 0 && (
            <div className="mt-5 text-left">
              <div className="kicker" style={{ marginBottom: "10px" }}>Your voucher codes</div>
              <div className="space-y-2.5">
                {vouchers.map((v) => (
                  <div key={v.code} className="row mb-0">
                    <span className="ico coral"><Icon name="ticket" size={20} /></span>
                    <div className="grow"><div className="t truncate">{v.title}</div></div>
                    <span className="code shrink-0 text-coral-deep" style={{ fontSize: "15px", letterSpacing: ".14em" }}>{v.code}</span>
                  </div>
                ))}
              </div>
            </div>
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
