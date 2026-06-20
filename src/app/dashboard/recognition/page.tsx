import Link from "next/link";
import Image from "next/image";
import { requireMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { walletHistory, coinSummary, companyRecognitionFeed, bestValueOffers, type HistoryKind } from "@/lib/coins";
import { toCoins, toLek, toEur } from "@/lib/currency";
import { CoinIcon } from "@/components/CoinIcon";
import { Mascot } from "@/components/Mascot";
import { Icon, type IconName } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { RecognitionForms } from "./RecognitionForms";

export const dynamic = "force-dynamic";

const HIST_ICON: Record<HistoryKind, IconName> = {
  spin: "sparkles", monthly: "gift", award: "trophy", "kudos-in": "heart", "kudos-out": "kudos", spend: "ticket", adjust: "coin",
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function CoinsPage() {
  const m = await requireMembership();
  const isAdmin = m.role === "ADMIN" || m.role === "HR";

  const [colleagues, feed, history, summary, bestValue] = await Promise.all([
    prisma.employeeProfile.findMany({
      where: { companyId: m.companyId, id: { not: m.id } },
      select: { id: true, displayName: true, role: true },
      orderBy: { displayName: "asc" },
    }),
    companyRecognitionFeed(m.companyId),
    walletHistory(m.id),
    coinSummary(m.id),
    bestValueOffers(m.recognitionCoins),
  ]);

  const balance = m.recognitionCoins;
  const lek = toLek(balance);
  const eur = toEur(lek);
  const allowance = toCoins(m.perksBudgetLek);
  const employerName = m.company.brandName || m.company.name;
  // A real company award — not the daily-spin grants (those are coin earnings, not recognition).
  const award = feed.find((t) => t.kind === "GRANT" && t.toEmployeeId === m.id && !/spin/i.test(t.memo ?? ""));

  return (
    <main className="mx-auto max-w-md px-5 py-5 md:max-w-5xl md:px-8 md:py-7">
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day">Your coins</div>
          <h1>PerxCoin wallet</h1>
        </div>
        <Mascot mood="charged" size={72} className="float" />
      </div>

      {/* balance hero — balance + currency conversions + this-month flow */}
      <div className="card-dark mt-4">
        <div className="blob" />
        <div className="relative z-[2] flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
          <div>
            <div className="kicker text-[var(--txt-on-dark-mut)]">Balance</div>
            <div className="mt-1 flex items-end gap-2 font-display text-[54px] font-bold leading-none text-[var(--txt-on-dark)]">
              {balance.toLocaleString("en-US")}<CoinIcon className="mb-2 size-8 text-lime" />
            </div>
            <div className="mt-2 text-sm text-[var(--txt-on-dark)]">≈ {lek.toLocaleString("en-US")} Lek <span className="text-[var(--txt-on-dark-mut)]">· ≈ €{eur.toLocaleString("en-US")}</span></div>
            <div className="mt-1 text-xs text-[var(--txt-on-dark-mut)]">1 coin = 100 Lek · +{allowance} added monthly by {employerName}</div>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 md:w-auto">
            <Stat label="Earned" value={`+${summary.earnedThisMonth}`} />
            <Stat label="Spent" value={`−${summary.spentThisMonth}`} />
            <Stat label="Given" value={`−${summary.givenThisMonth}`} />
          </div>
        </div>
      </div>

      {award && (
        <div className="eom mt-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/30"><Icon name="medal" size={26} className="text-[#5c6b14]" /></span>
          <div>
            <div className="kicker !text-[#5c6b14]">Employee of the month</div>
            <div className="font-display text-xl font-extrabold">You earned +{award.amount} coins!</div>
            <div className="text-[13px]">{award.memo || "Nominated by your team"}</div>
          </div>
        </div>
      )}

      {/* two-column body on desktop: kudos | history */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
        <section>
          <RecognitionForms colleagues={colleagues} balance={balance} isAdmin={isAdmin} />
        </section>

        <section>
          <div className="sec"><h3>History</h3><span className="link">{history.length} entries</span></div>
          {history.length === 0 ? (
            <p className="rounded-[18px] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">
              No coin activity yet — earn from your monthly allowance, the weekly spin, and kudos.
            </p>
          ) : (
            <div className="space-y-2.5">
              {history.map((h) => {
                const earned = h.signed > 0;
                return (
                  <div key={h.id} className="row mb-0">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${earned ? "bg-lime/25 text-ink" : "bg-coral/15 text-coral-deep"}`}>
                      <Icon name={HIST_ICON[h.kind]} size={18} />
                    </span>
                    <div className="min-w-0 grow">
                      <div className="t truncate">{h.label}</div>
                      <div className="s">{fmtDate(h.at)}</div>
                    </div>
                    <span className={`shrink-0 font-display text-base font-bold ${earned ? "text-lime-deep" : "text-coral"}`}>
                      {earned ? "+" : "−"}{h.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* maximize your coins — best-value perks */}
      {bestValue.length > 0 && (
        <section className="mt-9">
          <div className="sec"><h3>Maximize your coins</h3><Link href="/dashboard/employee#browse" className="link">Browse all →</Link></div>
          <p className="-mt-1 mb-3 text-sm text-muted">The best-value perks you can grab right now — most discount for your coins.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bestValue.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/employee/offer/${o.id}`}
                className="relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-2xl shadow-soft transition active:scale-[.99]"
                style={{ background: "var(--coral)" }}
              >
                {o.imageUrl && <Image src={o.imageUrl} alt="" fill sizes="(min-width:1024px) 240px, (min-width:640px) 50vw, 100vw" unoptimized className="object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="coupon-tex pointer-events-none absolute inset-0 z-[1]" />
                {o.discountPct > 0 && <span className="badge badge-new absolute left-2.5 top-2.5 z-[2]">−{o.discountPct}%</span>}
                <span className="absolute right-2.5 top-2.5 z-[2] inline-flex items-center rounded-full bg-coral px-2.5 py-1 font-display text-xs font-bold text-white shadow-[var(--sh-press)]">
                  <span className="inline-flex items-center gap-1">{toCoins(o.effLek)}<CoinIcon className="size-3" /></span>
                </span>
                <div className="relative z-[2] p-3 text-white">
                  <div className="font-display text-sm font-bold leading-tight line-clamp-2">{o.title}</div>
                  <div className="truncate text-[11px] text-white/85">{o.providerName}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* recognition wall */}
      <section className="mt-9">
        <div className="sec"><h3>Recognition wall</h3></div>
        {feed.length === 0 ? (
          <p className="rounded-[18px] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">
            No recognition yet. Be the first to call out great work.
          </p>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {feed.map((t) => {
              const fromName = t.kind === "GRANT" ? "Company" : t.from?.displayName ?? "Someone";
              const toName = t.to?.displayName ?? "Someone";
              return (
                <div key={t.id} className="row mb-0 flex-col items-stretch !gap-1.5">
                  <div className="flex items-center gap-2">
                    {t.kind === "GRANT" ? (
                      <span className="ico coral shrink-0"><Icon name="trophy" size={20} /></span>
                    ) : (
                      <Avatar name={fromName} seed={t.fromEmployeeId ?? fromName} size={42} className="shrink-0" />
                    )}
                    <p className="grow text-sm">
                      <span className="font-semibold">{fromName}</span>
                      <span className="text-muted"> → </span>
                      <span className="font-semibold">{toName}</span>
                    </p>
                    <span className="coin sm shrink-0">+{t.amount}</span>
                  </div>
                  {t.memo && <p className="pl-[54px] text-sm text-ink-soft">“{t.memo}”</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
      <div className="font-display text-lg font-bold text-[var(--txt-on-dark)]">{value}</div>
      <div className="text-[11px] text-[var(--txt-on-dark-mut)]">{label}</div>
    </div>
  );
}
