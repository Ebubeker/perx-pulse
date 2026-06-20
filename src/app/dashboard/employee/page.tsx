import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { getCatalog, resolveOffers } from "@/lib/gemini";
import { getT } from "@/lib/i18n";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { ChooseButton } from "./discover/ChooseButton";
import { BrowseOffers } from "./BrowseOffers";

export const dynamic = "force-dynamic";

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

  return (
    <main className="mx-auto max-w-md px-6 py-8">
      {/* 1 · Your PerxCoins */}
      <p className="text-sm text-muted">{t("common.morning")}</p>
      <h1 className="text-2xl font-bold">{m.displayName} 👋</h1>

      <div className="mt-4 rounded-2xl border border-gold-ink/25 bg-gradient-to-br from-gold-soft to-cream p-5">
        <p className="text-sm font-medium text-gold-ink/80">Your PerxCoins · {m.company.brandName || m.company.name}</p>
        <p className="mt-0.5 text-4xl font-bold text-gold-ink"><Coins amount={m.recognitionCoins} /></p>
        <p className="mt-1 text-xs text-muted">{toCoins(m.perksBudgetLek)} 🪙/mo from your employer · earn more by recognizing colleagues</p>
        <div className="mt-3 flex gap-2">
          <Link href="/dashboard/employee/wallet" className="rounded-lg bg-gold-ink px-3.5 py-1.5 text-sm font-semibold text-white">My perks</Link>
          <Link href="/dashboard/recognition" className="rounded-lg border border-gold-ink/30 px-3.5 py-1.5 text-sm font-semibold text-gold-ink">Earn coins</Link>
        </div>
      </div>

      {/* 2 · Discover Weekly */}
      <div className="mt-7 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Discover Weekly</h2>
        <Link href="/dashboard/employee/pulse" className="text-sm font-semibold text-primary">
          {recs.length ? "Retake Pulse" : "Take Pulse"}
        </Link>
      </div>
      <p className="text-sm text-muted">AI-picked packs from your weekly check-in.</p>

      {recs.length === 0 ? (
        <Link href="/dashboard/employee/pulse" className="mt-3 block rounded-2xl border border-dashed border-primary/40 bg-primary-soft/40 px-5 py-6 text-center">
          <p className="font-semibold text-primary">Take this week&apos;s Pulse →</p>
          <p className="mt-1 text-sm text-muted">A few taps and Perx builds perk packs for you.</p>
        </Link>
      ) : (
        <div className="mt-3 space-y-4">
          {packs.map(({ rec, items }) => {
            const taxFree = items.length > 0 && items.every((o) => o.taxFree);
            return (
              <div key={rec.id} className="rounded-2xl border border-line bg-paper p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-bold">{rec.label}</h3>
                  <span className="font-bold text-gold-ink"><Coins amount={toCoins(rec.totalLek)} /></span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{rec.rationale}</p>
                <ul className="mt-3 space-y-1.5">
                  {items.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                      <Link href={`/dashboard/employee/offer/${o.id}`} className="min-w-0 truncate">
                        <span className="font-medium underline-offset-2 hover:underline">{o.title}</span> <span className="text-muted">· {o.providerName}</span>
                      </Link>
                      <span className="shrink-0 font-semibold text-ink-soft"><Coins amount={toCoins(o.effLek)} /></span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  {taxFree && <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">Tax-free</span>}
                  <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-muted">{items.length} providers</span>
                </div>
                <div className="mt-4"><ChooseButton recId={rec.id} /></div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3 · Browse all offers */}
      <div id="browse" className="mt-8 scroll-mt-16">
        <h2 className="font-display text-lg font-bold">Browse all perks</h2>
        <p className="mb-3 text-sm text-muted">Every offer from every provider — pay with your coins, send to HR.</p>
        <BrowseOffers offers={catalog} initialCategory={initialCategory} />
      </div>

      {/* Quick links + latest pack */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/dashboard/employee/drops" className="rounded-xl border border-line bg-paper px-4 py-3 text-center text-sm font-semibold">⚡ Drops</Link>
        <Link href="/dashboard/employee/passport" className="rounded-xl border border-line bg-paper px-4 py-3 text-center text-sm font-semibold">🛂 Passport</Link>
        <Link href="/dashboard/leaderboard" className="rounded-xl border border-line bg-paper px-4 py-3 text-center text-sm font-semibold">🏆 Leaderboard</Link>
        <Link href="/dashboard/team" className="rounded-xl border border-line bg-paper px-4 py-3 text-center text-sm font-semibold">👥 Team packs</Link>
      </div>

      {latest && (
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-muted">{t("home.latest")}</h2>
          <Link href={`/dashboard/employee/package/${latest.id}`} className="block rounded-xl border border-line bg-paper px-4 py-3">
            <span className="font-medium">{latest.label}</span>{" "}
            <span className="text-sm text-muted">· <Coins amount={toCoins(latest.totalLek)} /> · {t(`status.${latest.status}`)}</span>
          </Link>
        </div>
      )}
    </main>
  );
}
