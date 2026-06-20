import { requireCompanyAdmin } from "@/lib/account";
import { companyInsights } from "@/lib/insights";
import { ALL_CATEGORIES } from "@/lib/passport";

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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="mt-1 text-sm font-semibold tracking-wide text-violet">INSIGHTS</p>
      <h1 className="text-2xl font-bold">Wellbeing radar</h1>

      {/* Perx Score */}
      <div className="mt-5 flex items-center gap-5 rounded-2xl border border-line bg-paper p-6">
        <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 border-primary">
          <span className="text-3xl font-bold text-primary">{ins.perxScore}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted">/ 100</span>
        </div>
        <div>
          <p className="text-lg font-bold">Perx Score · {scoreVerdict(ins.perxScore)}</p>
          <p className="mt-1 text-sm text-muted">
            A live index of how your team engages with benefits — participation, redemption, budget use, and recognition.
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold">{ins.participationPct}%</p>
          <p className="text-xs text-muted">took a Pulse</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold">{ins.engagementPct}%</p>
          <p className="text-xs text-muted">redeemed a perk</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold text-gold-ink">{ins.coinsMovedThisMonth}</p>
          <p className="text-xs text-muted">coins moved</p>
        </div>
      </div>

      {/* Mood radar */}
      <h2 className="mb-2 mt-8 text-sm font-semibold text-muted">How the team&apos;s week felt</h2>
      <div className="rounded-2xl border border-line bg-paper p-5">
        {ins.moods.every((x) => x.count === 0) ? (
          <p className="py-2 text-center text-sm text-muted">No pulses yet.</p>
        ) : (
          <div className="space-y-2">
            {ins.moods.map((x) => (
              <div key={x.mood} className="flex items-center gap-3">
                <span className="w-20 text-sm">{x.mood}</span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-cream">
                  <div className="h-full rounded-full" style={{ width: `${(x.count / maxMood) * 100}%`, background: MOOD_COLOR[x.mood] }} />
                </div>
                <span className="w-6 text-right text-sm font-semibold">{x.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category demand heatmap */}
      <h2 className="mb-2 mt-8 text-sm font-semibold text-muted">Where the demand is</h2>
      <div className="grid grid-cols-4 gap-2">
        {ins.categoryDemand.map((c) => {
          const intensity = c.count / ins.maxCategoryCount; // 0..1
          const meta = labelOf.get(c.category);
          return (
            <div
              key={c.category}
              className="flex flex-col items-center rounded-xl border border-line p-3 text-center"
              style={{ background: intensity > 0 ? `rgba(20, 98, 74, ${0.12 + intensity * 0.6})` : undefined }}
            >
              <span className="text-xl">{meta?.emoji}</span>
              <span className={`mt-1 text-xs font-semibold ${intensity > 0.5 ? "text-white" : ""}`}>{meta?.label}</span>
              <span className={`text-xs ${intensity > 0.5 ? "text-white/90" : "text-muted"}`}>{c.count}</span>
            </div>
          );
        })}
      </div>

      {/* Budget utilization */}
      <h2 className="mb-2 mt-8 text-sm font-semibold text-muted">Budget utilization</h2>
      <div className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted">{ins.budgetUsed.toLocaleString("en-US")} L used of {ins.budgetTotal.toLocaleString("en-US")} L</span>
          <span className="font-bold">{budgetPct}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-cream">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, budgetPct)}%` }} />
        </div>
      </div>
    </main>
  );
}
