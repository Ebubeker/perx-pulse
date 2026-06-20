import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { companyInsights } from "@/lib/insights";
import { ALL_CATEGORIES } from "@/lib/passport";
import { toCoins } from "@/lib/currency";
import { Icon } from "@/components/Icon";
import { Mascot } from "@/components/Mascot";

export const dynamic = "force-dynamic";

const MOOD_COLOR: Record<string, string> = {
  Stressful: "#f06a3f",
  Tiring: "#e0a23f",
  Productive: "#14624a",
  Social: "#7c6bf0",
  Flat: "#8a857c",
};

function scoreVerdict(s: number): { label: string; tone: string } {
  if (s >= 75) return { label: "Excellent", tone: "var(--lime)" };
  if (s >= 50) return { label: "Healthy", tone: "var(--lime)" };
  if (s >= 30) return { label: "Warming up", tone: "#e0a23f" };
  return { label: "Needs love", tone: "var(--coral)" };
}

export default async function InsightsPage() {
  const m = await requireCompanyAdmin();
  const ins = await companyInsights(m.companyId);
  const maxMood = Math.max(1, ...ins.moods.map((x) => x.count));
  const labelOf = new Map(ALL_CATEGORIES.map((c) => [c.key, c] as const));
  const budgetPct = ins.budgetTotal ? Math.round((ins.budgetUsed / ins.budgetTotal) * 100) : 0;
  const providerCats = ins.categoryDemand.filter((c) => c.count > 0).length;
  const verdict = scoreVerdict(ins.perxScore);

  // Real scorecard sub-metrics, derived from companyInsights (no mock numbers).
  const subScores = [
    { k: "Budget utilization", v: Math.min(100, budgetPct), label: `${budgetPct} / 100`, coral: false },
    { k: "Employee engagement", v: ins.engagementPct, label: `${ins.engagementPct} / 100`, coral: false },
    { k: "Pulse participation", v: ins.participationPct, label: `${ins.participationPct} / 100`, coral: false },
    { k: "Provider diversity", v: Math.round((providerCats / 8) * 100), label: `${providerCats} / 8`, coral: false },
  ];

  return (
    <main className="page" style={{ maxWidth: 920 }}>
      <div className="kicker text-coral">Anonymous · aggregated · no spying</div>
      <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight">Wellbeing radar</h1>
      <p className="mt-1 max-w-[480px] text-muted">
        Know what your people value — without spying. Every number is anonymous and aggregated across {ins.headcount} employee{ins.headcount === 1 ? "" : "s"}.
      </p>

      {/* Perx Score scorecard + sub-metrics */}
      <div className="grid g-2 mt-5 items-start">
        <div className="card-dark text-center">
          <div className="blob" />
          <div className="relative z-[2] flex flex-col items-center">
            <div className="kicker text-lime-deep">Overall Perx Score</div>
            <div
              className="ring mt-4"
              style={{ "--p": Math.min(100, ins.perxScore), "--size": "150px", "--fill": "var(--lime)" } as React.CSSProperties}
            >
              <div className="ring-c"><b>{ins.perxScore}</b><span>/ 100</span></div>
            </div>
            <span className="badge mt-4" style={{ background: verdict.tone, color: "var(--ink)" }}>
              {verdict.label}
            </span>
            <p className="mt-3 max-w-[300px] text-sm text-[var(--txt-on-dark-mut)]">
              A live index of how your team engages with benefits — participation, redemption, budget use, and recognition.
            </p>
          </div>
        </div>

        <div>
          <div className="card">
            {subScores.map((s, i) => (
              <div key={s.k} className={`metric ${i === subScores.length - 1 ? "mb-0" : ""}`}>
                <div className="top"><span className="k">{s.k}</span><span>{s.label}</span></div>
                <div className={`bar ${s.coral ? "coral" : ""}`}><i style={{ width: `${Math.min(100, s.v)}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="card mt-3.5 flex items-center gap-3" style={{ background: "var(--lime-soft)", borderColor: "#E3EBBE" }}>
            <Mascot mood="cheer" size={56} />
            <div className="text-sm">
              <b>Coins moved this month:</b> {ins.coinsMovedThisMonth.toLocaleString("en-US")}. Add more provider categories to lift diversity and your score.
            </div>
          </div>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid g-3 mt-[18px]">
        <div className="stat">
          <div className="v">{ins.participationPct}%</div>
          <div className="d">took a Pulse</div>
        </div>
        <div className="stat">
          <div className="v">{ins.engagementPct}%</div>
          <div className="d">redeemed a perk</div>
        </div>
        <div className="stat">
          <div className="v text-lime-deep">{ins.coinsMovedThisMonth.toLocaleString("en-US")}</div>
          <div className="d">coins moved</div>
        </div>
      </div>

      {/* Mood radar + budget utilization */}
      <div className="grid g-2 mt-[18px] items-start">
        <div>
          <div className="sec mt-0"><h3>How the team&apos;s week felt</h3></div>
          <div className="card">
            {ins.moods.every((x) => x.count === 0) ? (
              <p className="py-2 text-center text-sm text-muted">No pulses yet.</p>
            ) : (
              ins.moods.map((x, i) => (
                <div key={x.mood} className={`metric ${i === ins.moods.length - 1 ? "mb-0" : ""}`}>
                  <div className="top"><span className="k">{x.mood}</span><span>{x.count}</span></div>
                  <div className="bar"><i style={{ width: `${(x.count / maxMood) * 100}%`, background: MOOD_COLOR[x.mood] }} /></div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="sec mt-0"><h3>Budget utilization</h3></div>
          <div className="card">
            <div className="metric mb-0">
              <div className="top">
                <span className="k">
                  {toCoins(ins.budgetUsed).toLocaleString("en-US")} used of {toCoins(ins.budgetTotal).toLocaleString("en-US")} coins
                </span>
                <span>{budgetPct}%</span>
              </div>
              <div className="bar coral"><i style={{ width: `${Math.min(100, budgetPct)}%` }} /></div>
            </div>
          </div>
          <div className="card-dark mt-3.5">
            <div className="blob" />
            <div className="relative z-[2]">
              <div className="kicker text-lime-deep">AI insight</div>
              <div className="mt-2 font-display text-lg font-bold text-[var(--txt-on-dark)]">
                {ins.categoryDemand.find((c) => c.count === ins.maxCategoryCount && c.count > 0)
                  ? `${labelOf.get(ins.categoryDemand.reduce((a, b) => (b.count > a.count ? b : a)).category)?.label ?? "Wellness"} leads your team's demand.`
                  : "No demand signal yet — encourage your team to redeem."}
              </div>
              <p className="text-sm text-[var(--txt-on-dark-mut)]">
                Fund more providers where demand is highest to keep your Perx Score climbing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category demand heatmap */}
      <div className="sec"><h3>Where the demand is</h3></div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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

      <div className="sec"><h3>Add to your directory</h3></div>
      <Link href="/dashboard/company/people" className="btn btn-primary">Manage people &amp; providers →</Link>
    </main>
  );
}
