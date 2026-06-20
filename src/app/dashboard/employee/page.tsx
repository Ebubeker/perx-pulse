import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { getCatalog, resolveOffers } from "@/lib/gemini";
import { getT } from "@/lib/i18n";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { CoinIcon } from "@/components/CoinIcon";
import { Icon } from "@/components/Icon";
import { Mascot } from "@/components/Mascot";
import { ChooseButton } from "./discover/ChooseButton";
import { BrowseOffers } from "./BrowseOffers";

export const dynamic = "force-dynamic";

const PACK_TOP = ["coral", "lime", "ink"] as const;
const PACK_IMG = ["pack-sleepy", "pack-excited", "pack-mischief", "pack-love", "pack-happy", "pack-cool"] as const;

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

  const employerName = m.company.brandName || m.company.name;

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* greeting + mascot + bell */}
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day">{t("common.morning")}</div>
          <h1>{m.displayName}</h1>
        </div>
        <Mascot mood="charged" size={72} className="float ml-auto" />
        <Link href="/dashboard/employee/wallet" className="btn-icon" aria-label="Notifications"><Icon name="bolt" size={18} /></Link>
      </div>

      {/* budget + coins — dark card with ring */}
      <div className="card-dark mt-4">
        <div className="blob" />
        <div className="relative z-[2] flex items-center gap-[18px]">
          <div className="ring" style={{ "--p": ringP, "--size": "118px" } as React.CSSProperties}>
            <div className="ring-c"><b>{balance.toLocaleString("en-US")}</b><span>coins left</span></div>
          </div>
          <div className="flex-1">
            <div className="text-[13px] text-[var(--txt-on-dark-mut)]">Monthly budget · {employerName}</div>
            <div className="mt-0.5 inline-flex items-center gap-1 font-display text-[26px] font-bold text-[var(--txt-on-dark)]">{allowance}<CoinIcon className="size-[0.7em]" /></div>
            <Link href="/dashboard/recognition" className="coin mt-3"><CoinIcon className="size-4" />{balance.toLocaleString("en-US")} PerxCoin</Link>
          </div>
        </div>
      </div>

      {/* weekly pulse mini */}
      <div className="sec"><h3>Weekly Pulse</h3><Link href="/dashboard/employee/pulse" className="link">{recs.length ? "Retake →" : "Start →"}</Link></div>
      <p className="-mt-1.5 mb-3 text-sm text-muted">How&apos;s your week shaping up? Tap a few.</p>
      <div className="chip-row">
        {["Tired", "Stressed", "Social", "Focused", "Adventurous", "Save smart", "Treat me"].map((c) => (
          <Link key={c} href="/dashboard/employee/pulse" className="chip">{c}</Link>
        ))}
      </div>

      {/* ready — see your AI packs (design .ready: lime card) */}
      <Link
        href={recs.length > 0 ? "/dashboard/employee/discover" : "/dashboard/employee/pulse"}
        className="mt-5 flex items-center gap-3.5 rounded-[var(--r-lg)] bg-lime px-5 py-[18px] shadow-soft"
      >
        <div>
          <div className="font-mono text-[11px] tracking-[.14em] text-[#5c6b14]">READY</div>
          <div className="mt-0.5 font-display text-xl font-bold">
            {recs.length > 0 ? `See your ${recs.length} AI ${recs.length === 1 ? "pack" : "packs"}` : "Build your AI packs"}
          </div>
        </div>
        <span className="ml-auto grid size-11 shrink-0 place-items-center rounded-full bg-ink text-white">→</span>
      </Link>

      {/* drops (design .drop: coral-soft card) */}
      <Link
        href="/dashboard/employee/drops"
        className="mt-3.5 flex items-center gap-3 rounded-[var(--r-lg)] border border-[#F4D3C8] bg-coral-soft p-4"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-coral text-white"><Icon name="bolt" size={18} /></span>
        <div className="flex-1"><div className="font-bold">Perx Drops are live</div><div className="text-[13px] text-muted">Flash deals you claim with coins</div></div>
        <span className="text-coral">→</span>
      </Link>

      {/* Discover Weekly — the AI packs */}
      {recs.length > 0 && (
        <>
          <div className="sec"><h3>Discover Weekly</h3><Link href="/dashboard/employee/discover" className="link">See all →</Link></div>
          <div className="space-y-4">
            {packs.map(({ rec, items }, i) => {
              const top = PACK_TOP[i % PACK_TOP.length];
              const taxFree = items.length > 0 && items.every((o) => o.taxFree);
              const packImg = PACK_IMG[i % PACK_IMG.length];
              return (
                <div key={rec.id} className="pack">
                  <div className={`pack-top ${top} flex items-center justify-between gap-3.5`}>
                    <div className="min-w-0">
                      <div className="kk">AI Pick · {items.length} providers</div>
                      <h2 className="truncate">{rec.label}</h2>
                    </div>
                    <Image src={`/perx/packs/${packImg}.png`} alt="" width={64} height={88} unoptimized className="float h-[88px] w-16 shrink-0 rounded-[13px] object-cover shadow-[0_8px_18px_rgba(0,0,0,.18)]" />
                  </div>
                  <div className="pack-body">
                    <div className="why"><span className="spark"><Icon name="sparkles" size={15} /></span><span>{rec.rationale}</span></div>
                    <div className="chip-row mb-3.5">
                      {items.map((o) => (
                        <Link key={o.id} href={`/dashboard/employee/offer/${o.id}`} className="provchip">{o.providerName}</Link>
                      ))}
                    </div>
                    <div className="pack-foot">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted">{items.length} providers</span>
                        {taxFree && <span className="badge badge-tax">Tax-free</span>}
                        <span className="price"><Coins amount={toCoins(rec.totalLek)} /></span>
                      </div>
                      <ChooseButton recId={rec.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Browse all perks */}
      <div id="browse" className="scroll-mt-16">
        <div className="sec"><h3>Browse all perks</h3></div>
        <BrowseOffers offers={catalog} initialCategory={initialCategory} walletCoins={balance} />
      </div>

      {/* Quick links + latest pack */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/dashboard/employee/passport" className="tile flex flex-col items-center gap-1.5 text-center text-sm font-semibold"><Icon name="passport" size={20} /><span>Passport</span></Link>
        <Link href="/dashboard/leaderboard" className="tile flex flex-col items-center gap-1.5 text-center text-sm font-semibold"><Icon name="trophy" size={20} /><span>Leaderboard</span></Link>
        <Link href="/dashboard/team" className="tile flex flex-col items-center gap-1.5 text-center text-sm font-semibold"><Icon name="team" size={20} /><span>Team packs</span></Link>
        <Link href="/dashboard/employee/genie" className="tile flex flex-col items-center gap-1.5 text-center text-sm font-semibold"><Icon name="genie" size={20} /><span>Perx Genie</span></Link>
      </div>

      {latest && (
        <div className="mt-5">
          <div className="kicker mb-2">{t("home.latest")}</div>
          <Link href={`/dashboard/employee/package/${latest.id}`} className="row mb-0">
            <span className="ico coral"><Icon name="gift" size={20} /></span>
            <div className="grow"><div className="t">{latest.label}</div><div className="s">{t(`status.${latest.status}`)}</div></div>
            <span className="amt"><Coins amount={toCoins(latest.totalLek)} /></span>
          </Link>
        </div>
      )}
    </main>
  );
}
