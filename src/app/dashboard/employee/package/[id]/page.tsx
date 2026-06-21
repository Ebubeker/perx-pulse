import Link from "next/link";
import Image from "next/image";
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

  /* ──────────────────────────  DRAFT — the pack detail (design 13, enriched)  ────────────────────────── */
  const budgetLek = m.perksBudgetLek || pkg.totalLek;
  const afterLek = Math.max(0, budgetLek - pkg.totalLek);
  const ringPct = Math.min(100, Math.round((pkg.totalLek / Math.max(1, budgetLek)) * 100));
  const heroImgs = items.map((o) => o.imageUrl).filter((u): u is string => !!u).slice(0, 4);
  const savedCoins = toCoins(items.reduce((s, o) => s + (o.priceLek - o.effLek), 0));

  return (
    <main className="mx-auto max-w-md px-5 py-5 md:max-w-5xl md:px-8 md:py-7">
     <div className="md:grid md:grid-cols-12 md:items-start md:gap-8">
      <div className="md:col-span-7">
      {/* photo hero — the offers' real images behind the pack title */}
      <div className="relative overflow-hidden rounded-[var(--r-lg)] shadow-soft">
        <div className="absolute inset-0 flex">
          {heroImgs.length > 0 ? (
            heroImgs.map((src, i) => (
              <div key={i} className="relative flex-1">
                <Image src={src} alt="" fill sizes="(min-width:768px) 640px, 100vw" unoptimized className="object-cover" />
              </div>
            ))
          ) : (
            <div className="flex-1 bg-coral" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/25" />
        <div className="coupon-tex pointer-events-none absolute inset-0" />
        <Mascot mood="cool" size={74} className="float absolute right-3 top-3 z-[2] drop-shadow-lg" />
        <div className="relative z-[2] flex min-h-[200px] flex-col justify-end p-5 text-white">
          <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink"><Icon name="sparkles" size={12} /> AI Pick</span>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[.16em] text-white/75">{items.length} providers{taxFree ? " · tax-free" : ""}</div>
              <h1 className="font-display text-[26px] font-extrabold leading-tight">{pkg.label}</h1>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full bg-coral px-3 py-1.5 font-display text-base font-bold text-white shadow-[var(--sh-press)]"><Coins amount={toCoins(pkg.totalLek)} /></span>
          </div>
        </div>
      </div>

      {/* AI rationale with a buddy */}
      {pkg.rationale && (
        <div className="mt-4 flex items-start gap-3 rounded-[var(--r-lg)] border border-line bg-coral-soft/50 p-4">
          <Mascot mood="thinking" size={50} className="float shrink-0" />
          <div>
            <div className="kicker text-coral-deep">Why this pack</div>
            <p className="mt-1 text-sm text-ink-soft">{pkg.rationale}</p>
          </div>
        </div>
      )}

      {/* highlights */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-[var(--r-md)] border border-line bg-paper px-2 py-3 text-center">
          <div className="font-display text-xl font-extrabold">{items.length}</div>
          <div className="text-[11px] text-muted">Providers</div>
        </div>
        <div className="rounded-[var(--r-md)] border border-line bg-paper px-2 py-3 text-center">
          <div className="inline-flex items-center justify-center font-display text-xl font-extrabold"><Coins amount={toCoins(pkg.totalLek)} /></div>
          <div className="text-[11px] text-muted">You pay</div>
        </div>
        <div className="rounded-[var(--r-md)] border border-line bg-paper px-2 py-3 text-center">
          {savedCoins > 0 ? (
            <><div className="inline-flex items-center justify-center font-display text-xl font-extrabold text-lime-deep">−<Coins amount={savedCoins} /></div><div className="text-[11px] text-muted">You save</div></>
          ) : taxFree ? (
            <><div className="font-display text-xl font-extrabold text-coral">0%</div><div className="text-[11px] text-muted">Tax</div></>
          ) : (
            <><div className="font-display text-xl font-extrabold">{ringPct}%</div><div className="text-[11px] text-muted">Of budget</div></>
          )}
        </div>
      </div>

      {/* items with real photos */}
      <div className="sec mt-5"><h3>What&apos;s inside</h3></div>
      <div className="space-y-2.5">
        {items.map((o, i) => (
          <div key={o.id} className="fade-up flex items-center gap-3 rounded-[var(--r-lg)] border border-line bg-paper p-3 shadow-[var(--sh-1)]" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-coral-soft">
              {o.imageUrl ? (
                <Image src={o.imageUrl} alt="" fill sizes="64px" unoptimized className="object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-coral-deep"><Icon name={CAT_ICON[o.category] ?? "gift"} size={24} /></span>
              )}
            </span>
            <div className="min-w-0 grow">
              <div className="truncate font-display font-bold leading-tight">{o.providerName}</div>
              <div className="truncate text-xs text-muted">{o.title}{o.area ? ` · ${o.area}` : ""}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {o.discountPct > 0 && <span className="badge badge-new">−{o.discountPct}%</span>}
                {o.taxFree && <span className="badge badge-tax">Tax-free</span>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display font-bold"><Coins amount={toCoins(o.effLek)} /></div>
              <SwapButton packageId={pkg.id} offerId={o.id} />
            </div>
          </div>
        ))}
      </div>

      </div>{/* /left column */}

      <div className="mt-6 md:col-span-5 md:mt-0">
      {/* budget ring impact */}
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
      </div>{/* /right column */}
     </div>{/* /grid */}
    </main>
  );
}
