import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { getCatalog, resolveOffers } from "@/lib/gemini";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { CoinIcon } from "@/components/CoinIcon";
import { Icon } from "@/components/Icon";
import { Mascot } from "@/components/Mascot";
import { ChooseButton } from "./discover/ChooseButton";
import { BrowseOffers } from "./BrowseOffers";

export const dynamic = "force-dynamic";

const PACK_BG = ["var(--coral)", "var(--lime)", "var(--ink)"] as const;
const PACK_IMG = ["pack-sleepy", "pack-excited", "pack-mischief", "pack-love", "pack-happy", "pack-cool"] as const;

export default async function EmployeeHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const m = await getMembership();
  if (!m) redirect("/onboarding");
  if (m.role !== "EMPLOYEE") redirect("/dashboard/company");

  const sp = await searchParams;
  const initialCategory = typeof sp.cat === "string" ? sp.cat : "all";
  const [latestPulse, catalog] = await Promise.all([
    prisma.pulse.findFirst({
      where: { employeeProfileId: m.id },
      orderBy: { createdAt: "desc" },
      include: { recommendations: { orderBy: { createdAt: "asc" } } },
    }),
    getCatalog(),
  ]);
  const recs = latestPulse?.recommendations ?? [];
  const packs = await Promise.all(recs.map(async (rec) => ({ rec, items: await resolveOffers(rec.itemOfferIds) })));

  const balance = m.recognitionCoins;
  const allowance = toCoins(m.perksBudgetLek);
  const employerName = m.company.brandName || m.company.name;

  return (
    <main className="mx-auto max-w-md px-5 py-5 md:max-w-6xl md:px-8 md:py-7">
      {/* greeting + big mascot + wallet button */}
      <div className="flex items-start justify-between gap-3">
        <div className="greet">
          <div className="day">Welcome back</div>
          <h1>{m.displayName}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Mascot mood="charged" size={104} className="float" />
          <Link href="/dashboard/employee/wallet" className="grid size-11 shrink-0 place-items-center rounded-full bg-coral text-white shadow-[var(--sh-press)]" aria-label="Wallet">
            <Icon name="ticket" size={20} />
          </Link>
        </div>
      </div>

      {/* desktop: balance + discover side by side; mobile: stacked */}
      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,360px)_1fr]">
        {/* balance — kept deliberately simple */}
        <div className="card-dark self-start">
          <div className="blob" />
          <div className="relative z-[2]">
            <div className="kicker text-[var(--txt-on-dark-mut)]">PerxCoin balance</div>
            <div className="mt-1 flex items-end gap-2 font-display text-[44px] font-bold leading-none text-[var(--txt-on-dark)]">
              {balance.toLocaleString("en-US")}<CoinIcon className="mb-1.5 size-7 text-lime" />
            </div>
            <div className="mt-3 text-[13px] text-[var(--txt-on-dark-mut)]">+{allowance} added every month by {employerName}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/dashboard/employee/spin" className="coin"><Icon name="sparkles" size={16} />Earn more</Link>
              <Link href="/dashboard/employee/wallet" className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm font-semibold text-[var(--txt-on-dark)]">Vouchers</Link>
            </div>
          </div>
        </div>

        {/* Discover Weekly — image cards with overlay */}
        <div className="min-w-0">
          {recs.length > 0 ? (
            <>
              <div className="sec mt-0"><h3>Discover Weekly</h3><Link href="/dashboard/employee/pulse" className="link">Retake →</Link></div>
              <div className="hscroll -mx-5 px-5 md:mx-0 md:px-0">
                {packs.map(({ rec, items }, i) => {
                  const bg = PACK_BG[i % PACK_BG.length];
                  const packImg = PACK_IMG[i % PACK_IMG.length];
                  const taxFree = items.length > 0 && items.every((o) => o.taxFree);
                  return (
                    <div key={rec.id} className="relative flex h-[320px] w-[262px] flex-col justify-end overflow-hidden rounded-[var(--r-lg)] shadow-soft md:w-[300px]" style={{ background: bg }}>
                      <Image src={`/perx/packs/${packImg}.png`} alt="" fill sizes="300px" unoptimized className="object-contain p-7" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                      <div className="relative z-[2] p-5 text-white">
                        <div className="font-mono text-[11px] uppercase tracking-[.16em] text-white/80">AI Pick · {items.length} providers</div>
                        <h2 className="mt-1 font-display text-[26px] font-bold leading-[1.05]">{rec.label}</h2>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2">
                            {taxFree && <span className="badge badge-tax">Tax-free</span>}
                            <span className="inline-flex items-center font-display text-lg font-bold"><Coins amount={toCoins(rec.totalLek)} /></span>
                          </span>
                          <ChooseButton recId={rec.id} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <Link href="/dashboard/employee/pulse" className="ready">
              <div><div className="kk">READY</div><div className="t">Build your AI packs</div></div>
              <span className="go">→</span>
            </Link>
          )}
        </div>
      </div>

      {/* Browse all perks — fills the width */}
      <div id="browse" className="mt-7 scroll-mt-16">
        <div className="sec"><h3>Browse all perks</h3></div>
        <BrowseOffers offers={catalog} initialCategory={initialCategory} />
      </div>
    </main>
  );
}
