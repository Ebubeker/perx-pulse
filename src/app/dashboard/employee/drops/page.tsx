import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { Mascot } from "@/components/Mascot";
import { Coins } from "@/components/Coins";
import { Icon } from "@/components/Icon";
import { ClaimButton } from "./ClaimButton";

export const dynamic = "force-dynamic";

function endsIn(endsAt: Date): string {
  const ms = endsAt.getTime() - Date.now();
  if (ms <= 0) return "ended";
  const h = Math.floor(ms / 3_600_000);
  return h >= 24 ? `${Math.floor(h / 24)}d left` : h >= 1 ? `${h}h left` : `${Math.floor(ms / 60000)}m left`;
}

// Category → tinted photo-placeholder background, mirroring the design's drop cards.
const PH_BG: Record<string, string> = {
  food: "var(--coral-soft)",
  wellness: "var(--lime-soft)",
  fitness: "var(--lime-soft)",
  culture: "#E7Dfce",
  travel: "#E7Dfce",
};

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
  const soonest = drops[0];

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* topbar: title + mascot + live pill */}
      <div className="topbar">
        <h2 className="flex items-center gap-2"><Icon name="bolt" size={22} className="text-coral" />Perx Drops</h2>
        <Mascot mood="excited" size={52} />
        <span className="pill pill-live"><span className="dot pulse-dot" />Live</span>
      </div>

      {/* dark drop hero (design: kicker / big headline / countdown) */}
      <div className="card-dark">
        <div className="blob" />
        <div className="relative z-[2]">
          <div className="kicker text-lime">Flash perks · Tirana edition</div>
          <h1 className="mt-1 font-display text-[28px] font-bold leading-tight text-[var(--txt-on-dark)]">
            {drops.length} local drop{drops.length === 1 ? "" : "s"},<br />gone in a flash
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-[var(--txt-on-dark)]">
              <Coins amount={m.recognitionCoins} /> to claim
            </span>
            {soonest && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-[var(--txt-on-dark)]">
                <span className="dot pulse-dot size-[7px] rounded-full bg-coral" />{endsIn(soonest.endsAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 space-y-3.5">
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
          const left = d.totalSlots - d.claimedSlots;
          const soldOut = left <= 0;
          const tooPoor = m.recognitionCoins < d.costCoins;
          const phBg = PH_BG[d.category] ?? "var(--cream)";
          return (
            <div key={d.id} className="overflow-hidden rounded-[var(--r-lg)] border border-line bg-paper shadow-soft">
              {/* photo placeholder header (design: tinted band with a big glyph) */}
              <div className="grid h-[108px] place-items-center" style={{ background: phBg }}>
                <Icon name={d.category} size={48} className="text-ink/70" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <b className="font-display text-base font-bold">{d.title}</b>
                  <span className="badge badge-new shrink-0"><Coins amount={d.costCoins} /></span>
                </div>
                <p className="mt-1 text-[13px] text-muted">{d.provider.businessName}{d.area ? ` · ${d.area}` : ""}</p>
                {d.description && <p className="mt-2 text-[13px] text-muted">{d.description}</p>}
                {/* timer row + claimed/left badge */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-[var(--coral-deep)]">
                    <Icon name="clock" size={13} />
                    {d.claimedSlots > 0 ? `${d.claimedSlots} claimed · ` : ""}{soldOut ? "sold out" : `${left} left`} · {endsIn(d.endsAt)}
                  </span>
                </div>
                {/* claim / claimed / sold-out */}
                <div className="mt-3">
                  {claimedCode ? (
                    <span className="pill pill-ready"><span className="dot" />Claimed · {claimedCode}</span>
                  ) : soldOut ? (
                    <span className="pill pill-redeemed"><span className="dot" />Sold out</span>
                  ) : (
                    <ClaimButton dropId={d.id} disabled={tooPoor} />
                  )}
                  {!claimedCode && !soldOut && tooPoor && <p className="mt-1.5 text-xs text-muted">Earn more coins to claim this.</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
