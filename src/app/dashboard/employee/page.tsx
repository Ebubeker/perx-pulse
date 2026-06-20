import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { getCatalog, resolveOffers } from "@/lib/gemini";
import { getT } from "@/lib/i18n";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { CoinIcon } from "@/components/CoinIcon";
import { Mascot } from "@/components/Mascot";
import { ChooseButton } from "./discover/ChooseButton";
import { BrowseOffers } from "./BrowseOffers";

export const dynamic = "force-dynamic";

const PACK_TOP = ["coral", "lime", "ink"] as const;

export default async function EmployeeHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const m = await getMembership();
  if (!m) redirect("/onboarding");
  if (m.role !== "EMPLOYEE") redirect("/dashboard/company");

  const { t } = await getT();
  const sp = await searchParams;
  const initialCategory = typeof sp.cat === "string" ? sp.cat : "all";
  const [latestPulse, catalog, latest] = await Promise.all([
    prisma.pulse.findFirst({
      where: { employeeProfileId: m.id },
      orderBy: { createdAt: "desc" },
      include: { recommendations: { orderBy: { createdAt: "asc" } } },
    }),
    getCatalog(),
    prisma.perkPackage.findFirst({ where: { employeeProfileId: m.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const recs = latestPulse?.recommendations ?? [];
  const packs = await Promise.all(recs.map(async (rec) => ({ rec, items: await resolveOffers(rec.itemOfferIds) })));

  const balance = m.recognitionCoins;
  const allowance = toCoins(m.perksBudgetLek);
  const ringP = Math.min(100, Math.round((balance / Math.max(allowance, 1)) * 100));

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* greeting + mascot */}
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day">{t("common.morning")} 👋</div>
          <h1>{m.displayName}</h1>
        </div>
        <Mascot mood="charged" size={66} className="float" />
      </div>

      {/* PerxCoin wallet — dark card with ring */}
      <div className="card-dark mt-3">
        <div className="blob" />
        <div className="relative z-[2] flex items-center gap-4">
          <div className="ring" style={{ "--p": ringP, "--size": "118px" } as React.CSSProperties}>
            <div className="ring-c"><b>{balance.toLocaleString("en-US")}</b><span>coins</span></div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-[var(--txt-on-dark-mut)]">Your PerxCoins · {m.company.brandName || m.company.name}</div>
            <div className="mt-1 font-display text-[15px] font-semibold text-[var(--txt-on-dark)]">{allowance} 🪙/mo from your employer</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/dashboard/employee/wallet" className="coin"><CoinIcon className="size-4" />My perks</Link>
              <Link href="/dashboard/recognition" className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm font-semibold text-[var(--txt-on-dark)]">Earn coins</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Discover Weekly */}
      <div className="sec"><h3>Discover Weekly</h3><Link href="/dashboard/employee/pulse" className="link">{recs.length ? "Retake Pulse →" : "Take Pulse →"}</Link></div>

      {recs.length === 0 ? (
        <Link href="/dashboard/employee/pulse" className="flex items-center gap-3 rounded-[26px] border border-dashed border-coral/40 bg-coral-soft p-5">
          <Mascot mood="thinking" size={52} />
          <div>
            <div className="font-display text-lg font-bold">Take this week&apos;s Pulse</div>
            <div className="text-sm text-muted">A few taps and Perx builds 3 AI perk packs for you.</div>
          </div>
        </Link>
      ) : (
        <div className="space-y-4">
          {packs.map(({ rec, items }, i) => {
            const top = PACK_TOP[i % PACK_TOP.length];
            const taxFree = items.length > 0 && items.every((o) => o.taxFree);
            return (
              <div key={rec.id} className="pack">
                <div className={`pack-top ${top}`}>
                  <div className="kk">AI Pick · {items.length} providers</div>
                  <h2>{rec.label}</h2>
                </div>
                <div className="pack-body">
                  <div className="why"><span className="spark">✦</span><span>{rec.rationale}</span></div>
                  <ul className="space-y-1.5">
                    {items.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                        <Link href={`/dashboard/employee/offer/${o.id}`} className="min-w-0 truncate">
                          <span className="font-medium underline-offset-2 hover:underline">{o.title}</span> <span className="text-muted">· {o.providerName}</span>
                        </Link>
                        <span className="shrink-0 font-semibold text-ink-soft"><Coins amount={toCoins(o.effLek)} /></span>
                      </li>
                    ))}
                  </ul>
                  <div className="pack-foot">
                    <div className="flex items-center gap-2">
                      <span className="price"><Coins amount={toCoins(rec.totalLek)} /></span>
                      {taxFree && <span className="badge badge-tax">Tax-free</span>}
                    </div>
                    <ChooseButton recId={rec.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Browse all perks */}
      <div id="browse" className="scroll-mt-16">
        <div className="sec"><h3>Browse all perks</h3></div>
        <BrowseOffers offers={catalog} initialCategory={initialCategory} walletCoins={balance} />
      </div>

      {/* Drops */}
      <Link href="/dashboard/employee/drops" className="mt-5 flex items-center gap-3 rounded-[26px] border border-[#F4D3C8] bg-coral-soft p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-coral text-white">⚡</span>
        <div className="flex-1"><div className="font-bold">Perx Drops are live</div><div className="text-[13px] text-muted">Flash deals you claim with coins</div></div>
        <span className="text-coral">→</span>
      </Link>

      {/* Quick links + latest pack */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link href="/dashboard/employee/passport" className="tile text-center text-sm font-semibold">🛂 Passport</Link>
        <Link href="/dashboard/leaderboard" className="tile text-center text-sm font-semibold">🏆 Leaderboard</Link>
        <Link href="/dashboard/team" className="tile text-center text-sm font-semibold">👥 Team packs</Link>
        <Link href="/dashboard/employee/genie" className="tile text-center text-sm font-semibold">✨ Perx Genie</Link>
      </div>

      {latest && (
        <div className="mt-5">
          <div className="kicker mb-2">{t("home.latest")}</div>
          <Link href={`/dashboard/employee/package/${latest.id}`} className="row mb-0">
            <span className="ico coral">🎁</span>
            <div className="grow"><div className="t">{latest.label}</div><div className="s">{t(`status.${latest.status}`)}</div></div>
            <span className="amt"><Coins amount={toCoins(latest.totalLek)} /></span>
          </Link>
        </div>
      )}
    </main>
  );
}
