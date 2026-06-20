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
import { ChoosePackCard } from "./discover/ChoosePackCard";
import { BrowseOffers } from "./BrowseOffers";

export const dynamic = "force-dynamic";

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
    <main className="mx-auto max-w-md px-5 py-5 md:max-w-5xl md:px-8 md:py-7">
      {/* header — character on top, name below */}
      <div className="flex items-start justify-between gap-3">
        <Mascot mood="charged" size={96} className="float" />
        <Link href="/dashboard/employee/wallet" className="grid size-11 shrink-0 place-items-center rounded-full bg-coral text-white shadow-[var(--sh-press)]" aria-label="Wallet">
          <Icon name="ticket" size={20} />
        </Link>
      </div>
      <div className="greet mt-1">
        <div className="day">Welcome back</div>
        <h1>{m.displayName}</h1>
      </div>

      {/* balance — on top, full width, simple */}
      <div className="card-dark mt-4">
        <div className="blob" />
        <div className="relative z-[2] flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="kicker text-[var(--txt-on-dark-mut)]">PerxCoin balance</div>
            <div className="mt-1 flex items-end gap-2 font-display text-[46px] font-bold leading-none text-[var(--txt-on-dark)]">
              {balance.toLocaleString("en-US")}<CoinIcon className="mb-1.5 size-7 text-lime" />
            </div>
            <div className="mt-2 text-[13px] text-[var(--txt-on-dark-mut)]">+{allowance} added every month by {employerName}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/employee/spin" className="coin"><Icon name="sparkles" size={16} />Earn more</Link>
            <Link href="/dashboard/employee/wallet" className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm font-semibold text-[var(--txt-on-dark)]">Vouchers</Link>
          </div>
        </div>
      </div>

      {/* Discover Weekly — the pack image IS the card */}
      {recs.length > 0 ? (
        <>
          <div className="sec"><h3>Discover Weekly</h3><Link href="/dashboard/employee/pulse" className="link">Retake →</Link></div>
          <div className="hscroll">
            {packs.map(({ rec, items }, i) => {
              const packImg = PACK_IMG[i % PACK_IMG.length];
              return (
                <ChoosePackCard key={rec.id} recId={rec.id} className="relative block h-[320px] w-[248px] overflow-hidden rounded-xl md:w-[268px]">
                  <Image src={`/perx/packs/${packImg}.png`} alt="" fill sizes="268px" unoptimized className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <span className="absolute right-3 top-3 z-[2] inline-flex items-center rounded-full bg-coral px-3 py-1.5 font-display text-sm font-bold text-white shadow-[var(--sh-press)]">
                    <Coins amount={toCoins(rec.totalLek)} />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="font-mono text-[10px] uppercase tracking-[.16em] text-white/75">AI Pick · {items.length} providers</div>
                    <h2 className="mt-0.5 font-display text-[22px] font-bold leading-tight">{rec.label}</h2>
                  </div>
                </ChoosePackCard>
              );
            })}
          </div>
        </>
      ) : (
        <Link href="/dashboard/employee/pulse" className="ready mt-4">
          <div><div className="kk">READY</div><div className="t">Build your AI packs</div></div>
          <span className="go">→</span>
        </Link>
      )}

      {/* Browse all perks */}
      <div id="browse" className="mt-7 scroll-mt-16">
        <div className="sec"><h3>Browse all perks</h3></div>
        <BrowseOffers offers={catalog} initialCategory={initialCategory} />
      </div>
    </main>
  );
}
