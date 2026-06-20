import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { Mascot } from "@/components/Mascot";
import { Coins } from "@/components/Coins";
import { ClaimButton } from "./ClaimButton";

export const dynamic = "force-dynamic";

function endsIn(endsAt: Date): string {
  const ms = endsAt.getTime() - Date.now();
  if (ms <= 0) return "ended";
  const h = Math.floor(ms / 3_600_000);
  return h >= 24 ? `${Math.floor(h / 24)}d left` : h >= 1 ? `${h}h left` : `${Math.floor(ms / 60000)}m left`;
}

export default async function EmployeeDropsPage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const now = new Date();
  const [drops, myClaims] = await Promise.all([
    prisma.drop.findMany({
      where: { active: true, endsAt: { gt: now } },
      include: { provider: { select: { businessName: true } } },
      orderBy: { endsAt: "asc" },
    }),
    prisma.dropClaim.findMany({ where: { employeeProfileId: m.id }, select: { dropId: true, code: true } }),
  ]);
  const claimedById = new Map(myClaims.map((c) => [c.dropId, c.code] as const));

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* topbar with live pill + mascot */}
      <div className="topbar">
        <h2>⚡ Perx Drops</h2>
        <Mascot mood="excited" size={44} />
        <span className="pill pill-live"><span className="dot pulse-dot" />Live</span>
      </div>

      {/* dark drop hero */}
      <div className="card-dark">
        <div className="blob" />
        <div className="relative z-[2]">
          <div className="kicker text-lime">Flash perks · limited</div>
          <h1 className="mt-1 font-display text-[28px] font-bold text-[var(--txt-on-dark)]">Gone in a flash</h1>
          <p className="mt-2 text-[13px] text-[var(--txt-on-dark-mut)]">Spend the coins you&apos;ve earned. First come, first served.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-[var(--txt-on-dark)]">
            <Coins amount={m.recognitionCoins} /> to claim
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        {drops.length === 0 && (
          <div className="flex items-center gap-3 rounded-[26px] border border-dashed border-coral/40 bg-coral-soft p-5">
            <Mascot mood="sleepy" size={52} />
            <div>
              <div className="font-display text-lg font-bold">No live drops right now</div>
              <div className="text-sm text-muted">Check back soon for flash perks.</div>
            </div>
          </div>
        )}
        {drops.map((d) => {
          const claimedCode = claimedById.get(d.id);
          const soldOut = d.claimedSlots >= d.totalSlots;
          const tooPoor = m.recognitionCoins < d.costCoins;
          return (
            <div key={d.id} className="overflow-hidden rounded-[var(--r-lg)] border border-line bg-paper shadow-soft">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">{d.title}</h2>
                  <span className="coin sm shrink-0"><Coins amount={d.costCoins} /></span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{d.provider.businessName}{d.area ? ` · ${d.area}` : ""}</p>
                {d.description && <p className="mt-2 text-sm text-ink-soft">{d.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="pill pill-live"><span className="dot pulse-dot" />{endsIn(d.endsAt)}</span>
                  <span className="badge badge-new">{d.totalSlots - d.claimedSlots} of {d.totalSlots} left</span>
                </div>
                <div className="mt-4">
                  {claimedCode ? (
                    <p className="rounded-[var(--r-md)] border border-coral/30 bg-coral-soft px-4 py-2.5 text-center text-sm font-semibold text-coral">✓ Claimed · {claimedCode}</p>
                  ) : soldOut ? (
                    <p className="rounded-[var(--r-md)] border border-line bg-cream px-4 py-2.5 text-center text-sm text-muted">Sold out</p>
                  ) : (
                    <ClaimButton dropId={d.id} disabled={tooPoor} />
                  )}
                  {!claimedCode && !soldOut && tooPoor && <p className="mt-1.5 text-center text-xs text-muted">Earn more coins to claim this.</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
