import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
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
    <main className="mx-auto max-w-md px-6 py-10">
      <div className="mt-1 flex items-baseline justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-accent">DROPS · limited</p>
          <h1 className="text-2xl font-bold">Flash perks</h1>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-sm font-bold text-gold-ink">{m.recognitionCoins} coins</span>
      </div>
      <p className="mt-1 text-sm text-muted">Spend the coins you&apos;ve earned. First come, first served.</p>

      <div className="mt-6 space-y-4">
        {drops.length === 0 && (
          <p className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No live drops right now. Check back soon.</p>
        )}
        {drops.map((d) => {
          const claimedCode = claimedById.get(d.id);
          const soldOut = d.claimedSlots >= d.totalSlots;
          const tooPoor = m.recognitionCoins < d.costCoins;
          return (
            <div key={d.id} className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">{d.title}</h2>
                <span className="shrink-0 font-bold text-gold-ink">{d.costCoins} 🪙</span>
              </div>
              <p className="mt-0.5 text-sm text-muted">{d.provider.businessName}{d.area ? ` · ${d.area}` : ""}</p>
              {d.description && <p className="mt-2 text-sm text-ink-soft">{d.description}</p>}
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-accent-soft px-2.5 py-1 font-bold text-accent">⏳ {endsIn(d.endsAt)}</span>
                <span className="rounded-full bg-cream px-2.5 py-1 font-semibold text-muted">{d.totalSlots - d.claimedSlots} of {d.totalSlots} left</span>
              </div>
              <div className="mt-4">
                {claimedCode ? (
                  <p className="rounded-xl border border-primary/30 bg-primary-soft px-4 py-2.5 text-center text-sm font-semibold text-primary">✓ Claimed · {claimedCode}</p>
                ) : soldOut ? (
                  <p className="rounded-xl border border-line bg-cream px-4 py-2.5 text-center text-sm text-muted">Sold out</p>
                ) : (
                  <ClaimButton dropId={d.id} disabled={tooPoor} />
                )}
                {!claimedCode && !soldOut && tooPoor && <p className="mt-1.5 text-center text-xs text-muted">Earn more coins to claim this.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
