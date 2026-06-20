import { requireCompanyAdmin } from "@/lib/account";
import { companyInsights } from "@/lib/insights";
import { ALL_CATEGORIES } from "@/lib/passport";
import { toCoins } from "@/lib/currency";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

const MOOD_COLOR: Record<string, string> = {
  Stressful: "#f06a3f",
  Tiring: "#e0a23f",
  Productive: "#14624a",
  Social: "#7c6bf0",
  Flat: "#8a857c",
};

function scoreVerdict(s: number): string {
  if (s >= 75) return "Thriving";
  if (s >= 50) return "Healthy";
  if (s >= 30) return "Warming up";
  return "Needs love";
}

export default async function InsightsPage() {
  const m = await requireCompanyAdmin();
  const ins = await companyInsights(m.companyId);
  const maxMood = Math.max(1, ...ins.moods.map((x) => x.count));
  const labelOf = new Map(ALL_CATEGORIES.map((c) => [c.key, c] as const));
  const budgetPct = ins.budgetTotal ? Math.round((ins.budgetUsed / ins.budgetTotal) * 100) : 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-5">
      <div className="kicker text-coral">Anonymous · aggregated · no spying</div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Wellbeing radar</h1>

      {/* Perx Score — dark scorecard with gauge ring */}
      <div className="card-dark mt-5">
        <div className="blob" />
        <div className="relative z-[2] flex items-center gap-5">
          <div
            className="ring"
            style={{ "--p": Math.min(100, ins.perxScore), "--size": "120px", "--fill": "var(--lime)" } as React.CSSProperties}
          >
            <div className="ring-c"><b>{ins.perxScore}</b><span>/ 100</span></div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="kicker text-lime-deep">Perx Score</div>
            <div className="mt-1 font-display text-xl font-bold text-[var(--txt-on-dark)]">{scoreVerdict(ins.perxScore)}</div>
            <p className="mt-1 text-sm text-[var(--txt-on-dark-mut)]">
              A live index of how your team engages with benefits — participation, redemption, budget use, and recognition.
            </p>
          </div>
        </div>
      </div>

      {/* KPI stat tiles */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="stat">
          <div className="v">{ins.participationPct}%</div>
          <div className="d">took a Pulse</div>
        </div>
        <div className="stat">
          <div className="v">{ins.engagementPct}%</div>
          <div className="d">redeemed a perk</div>
        </div>
        <div className="stat">
          <div className="v text-lime-deep">{ins.coinsMovedThisMonth}</div>
          <div className="d">coins moved</div>
        </div>
      </div>

      {/* Mood radar */}
      <div className="sec"><h3>How the team&apos;s week felt</h3></div>
      <div className="card">
        {ins.moods.every((x) => x.count === 0) ? (
          <p className="py-2 text-center text-sm text-muted">No pulses yet.</p>
        ) : (
          <div>
            {ins.moods.map((x) => (
              <div key={x.mood} className="metric mb-3 last:mb-0">
                <div className="top">
                  <span className="k">{x.mood}</span>
                  <span>{x.count}</span>
                </div>
                <div className="bar">
                  <i style={{ width: `${(x.count / maxMood) * 100}%`, background: MOOD_COLOR[x.mood] }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category demand heatmap */}
      <div className="sec"><h3>Where the demand is</h3></div>
      <div className="grid grid-cols-4 gap-2">
        {ins.categoryDemand.map((c) => {
          const intensity = c.count / ins.maxCategoryCount; // 0..1
          const meta = labelOf.get(c.category);
          return (
            <div
              key={c.category}
              className="tile flex flex-col items-center p-3 text-center"
              style={{ background: intensity > 0 ? `rgba(236, 106, 77, ${0.12 + intensity * 0.6})` : undefined }}
            >
              <span className={intensity > 0.5 ? "text-white" : "text-coral"}>{meta && <Icon name={meta.icon} size={22} />}</span>
              <span className={`mt-1 text-xs font-semibold ${intensity > 0.5 ? "text-white" : ""}`}>{meta?.label}</span>
              <span className={`text-xs ${intensity > 0.5 ? "text-white/90" : "text-muted"}`}>{c.count}</span>
            </div>
          );
        })}
      </div>

      {/* Budget utilization */}
      <div className="sec"><h3>Budget utilization</h3></div>
      <div className="card">
        <div className="metric mb-0">
          <div className="top">
            <span className="k">
              {toCoins(ins.budgetUsed).toLocaleString("en-US")} used of {toCoins(ins.budgetTotal).toLocaleString("en-US")} coins
            </span>
            <span>{budgetPct}%</span>
          </div>
          <div className="bar coral">
            <i style={{ width: `${Math.min(100, budgetPct)}%` }} />
          </div>
        </div>
      </div>
    </main>
  );
}
