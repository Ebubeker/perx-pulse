import { requireProvider } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { setDropActive } from "@/lib/drop-actions";
import { Coins } from "@/components/Coins";
import { Icon } from "@/components/Icon";
import { DropForm } from "./DropForm";

export const dynamic = "force-dynamic";

function endsIn(endsAt: Date): string {
  const ms = endsAt.getTime() - Date.now();
  if (ms <= 0) return "ended";
  const h = Math.floor(ms / 3_600_000);
  return h >= 24 ? `${Math.floor(h / 24)}d left` : h >= 1 ? `${h}h left` : `${Math.floor(ms / 60000)}m left`;
}

export default async function ProviderDropsPage() {
  const p = await requireProvider();
  const drops = await prisma.drop.findMany({
    where: { providerId: p.id },
    include: { claims: { include: { employee: { select: { displayName: true } } }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page">
      <div className="kicker text-coral">Grow your demand</div>
      <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Flash drops &amp; campaigns</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Fill dead capacity. Employees claim instantly with their PerxCoins — pure demand, zero CAC.
      </p>

      <div className="g-2 mt-6 items-start">
        {/* Create drop */}
        <div>
          <div className="sec"><h3>New drop</h3></div>
          <div className="card">
            <DropForm defaultCategory={p.category} />
          </div>
        </div>

        {/* Your drops */}
        <div>
          <div className="sec"><h3>Your drops ({drops.length})</h3></div>
          {drops.length === 0 ? (
            <div className="card text-center text-sm text-muted">No drops yet.</div>
          ) : (
            <div className="g-2">
              {drops.map((d) => {
                const pct = Math.min(100, Math.round((d.claimedSlots / Math.max(d.totalSlots, 1)) * 100));
                return (
                  <div
                    key={d.id}
                    className={`card overflow-hidden !p-0 ${!d.active ? "opacity-60" : ""}`}
                  >
                    {/* card top — coral banner like the design's flash-drop card */}
                    <div className="flex items-start justify-between gap-3 bg-coral px-5 py-4 text-white">
                      <div className="min-w-0">
                        <div className="kicker text-white/85">Flash drop</div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/20 text-white">
                            <Icon name="bolt" size={16} />
                          </span>
                          <span className="truncate font-display text-xl font-bold">{d.title}</span>
                        </div>
                      </div>
                      {d.active ? (
                        <span className="pill pill-live shrink-0"><span className="dot pulse-dot" />Live</span>
                      ) : (
                        <span className="pill pill-redeemed shrink-0"><span className="dot" />Hidden</span>
                      )}
                    </div>

                    {/* card body */}
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-lime-deep"><Coins amount={d.costCoins} /></span>
                        <span className="text-muted">{endsIn(d.endsAt)} · {d.category}</span>
                      </div>

                      <div className="mt-3">
                        <div className="metric mb-0">
                          <div className="top"><span className="k">Claimed</span><span>{d.claimedSlots}/{d.totalSlots}</span></div>
                          <div className="bar coral"><i style={{ width: `${pct}%` }} /></div>
                        </div>
                      </div>

                      {d.claims.length > 0 && (
                        <p className="mt-3 text-xs text-ink-soft">
                          Claimed by {d.claims.map((c) => c.employee.displayName).join(", ")}
                        </p>
                      )}

                      <form action={setDropActive.bind(null, d.id, !d.active)} className="mt-4">
                        <button type="submit" className="btn btn-ghost w-full px-4 py-2 text-sm">
                          {d.active ? "Hide" : "Show"}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
