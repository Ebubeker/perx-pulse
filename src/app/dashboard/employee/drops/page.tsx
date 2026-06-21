import Image from "next/image";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { Mascot } from "@/components/Mascot";
import { Coins } from "@/components/Coins";
import { Icon, type IconName } from "@/components/Icon";
import { ClaimButton } from "./ClaimButton";
import { Countdown } from "./Countdown";

export const dynamic = "force-dynamic";

const CAT_COLOR: Record<string, string> = {
  wellness: "var(--lime)", fitness: "var(--coral)", food: "#E8B339", health: "#7C6BF0",
  travel: "#6E4A34", learning: "var(--ink)", culture: "var(--coral-deep)", telecom: "var(--lime-deep)",
};
const CAT_ICON: Record<string, IconName> = {
  wellness: "wellness", fitness: "fitness", food: "food", health: "health",
  travel: "travel", learning: "learning", culture: "culture", telecom: "telecom",
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
    <main className="mx-auto max-w-md px-5 py-5 md:max-w-5xl md:px-8 md:py-7">
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day flex items-center gap-1.5"><Icon name="bolt" size={13} className="text-coral" />Perx Drops</div>
          <h1>Flash perks, gone fast</h1>
        </div>
        <Mascot mood="excited" size={56} className="float" />
      </div>
      <p className="mt-1 text-sm text-muted">Limited slots, on the clock — claim instantly with your PerxCoins.</p>

      {/* hero — live countdown to the soonest-ending drop */}
      {soonest ? (
        <div className="card-dark mt-4">
          <div className="blob" />
          <div className="relative z-[2] flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="kicker text-[var(--txt-on-dark-mut)]">{drops.length} live drop{drops.length === 1 ? "" : "s"} · soonest ends in</div>
              <div className="mt-1 font-display text-[44px] font-bold leading-none text-[var(--txt-on-dark)]">
                <Countdown endsAt={soonest.endsAt.toISOString()} variant="hero" />
              </div>
              <div className="mt-2 text-sm text-[var(--txt-on-dark-mut)]">{soonest.title} · {soonest.provider.businessName}</div>
            </div>
            <span className="pill pill-live self-start md:self-end"><span className="dot pulse-dot" />Live now</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-[var(--r-lg)] border border-line bg-coral-soft/60 p-4">
          <Mascot mood="sleepy" size={52} className="shrink-0" />
          <div className="text-sm"><b className="text-ink">No live drops right now.</b> Check back soon for flash perks near you.</div>
        </div>
      )}

      {/* drop cards */}
      {drops.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drops.map((d) => {
            const claimedCode = claimedById.get(d.id);
            const left = d.totalSlots - d.claimedSlots;
            const soldOut = left <= 0;
            const tooPoor = m.recognitionCoins < d.costCoins;
            const pct = Math.min(100, Math.round((d.claimedSlots / Math.max(d.totalSlots, 1)) * 100));
            return (
              <div key={d.id} className="relative flex min-h-[270px] flex-col justify-end overflow-hidden rounded-2xl shadow-soft" style={{ background: CAT_COLOR[d.category] ?? "var(--coral)" }}>
                {d.imageUrl ? (
                  <Image src={d.imageUrl} alt="" fill sizes="(min-width:1024px) 340px, (min-width:640px) 50vw, 100vw" unoptimized className="object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-white/30"><Icon name={CAT_ICON[d.category] ?? "bolt"} size={60} /></span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/55 to-black/15" />
                <div className="coupon-tex pointer-events-none absolute inset-0 z-[1]" />
                <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"><Icon name="clock" size={11} /> <Countdown endsAt={d.endsAt.toISOString()} /></span>
                <span className="absolute right-3 top-3 z-[2] inline-flex items-center rounded-full bg-coral px-3 py-1.5 font-display text-sm font-bold text-white shadow-[var(--sh-press)]"><Coins amount={d.costCoins} /></span>

                <div className="relative z-[2] p-4 text-white">
                  <h2 className="line-clamp-1 font-display text-lg font-bold leading-tight">{d.title}</h2>
                  <div className="truncate text-xs text-white/80">{d.provider.businessName}{d.area ? ` · ${d.area}` : ""}</div>

                  {/* slots progress — kept */}
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                    <div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-white/85">{d.claimedSlots} claimed · {soldOut ? "sold out" : `${left} of ${d.totalSlots} left`}</div>

                  {/* action */}
                  <div className="mt-2.5">
                    {claimedCode ? (
                      <div className="flex items-center justify-between rounded-xl bg-lime px-3 py-2 text-ink">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold"><Icon name="check" size={14} strokeWidth={3} /> Claimed</span>
                        <span className="code text-[14px] tracking-[.1em]">{claimedCode}</span>
                      </div>
                    ) : soldOut ? (
                      <div className="rounded-xl bg-white/15 px-3 py-2 text-center text-sm font-semibold text-white/85">Sold out</div>
                    ) : (
                      <ClaimButton dropId={d.id} disabled={tooPoor} cost={d.costCoins} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
