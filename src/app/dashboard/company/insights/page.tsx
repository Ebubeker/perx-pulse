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

// Fixed legend colours, in the design's order (coral → lime → brown → grey).
const DONUT_COLORS = ["var(--coral)", "var(--lime)", "var(--brown)", "#C9C2AE"];

export default async function InsightsPage() {
  const m = await requireCompanyAdmin();
  const ins = await companyInsights(m.companyId);
  const maxMood = Math.max(1, ...ins.moods.map((x) => x.count));
  const labelOf = new Map(ALL_CATEGORIES.map((c) => [c.key, c] as const));
  const budgetPct = ins.budgetTotal ? Math.round((ins.budgetUsed / ins.budgetTotal) * 100) : 0;
  const providerCats = ins.categoryDemand.filter((c) => c.count > 0).length;
  const verdict = scoreVerdict(ins.perxScore);

  // ── Donut: top categories by demand, as % of total, into the design's 4 legend slots.
  const demandTotal = ins.categoryDemand.reduce((s, c) => s + c.count, 0);
  const topCats = [...ins.categoryDemand].sort((a, b) => b.count - a.count).slice(0, 4);
  const legend = topCats.map((c, i) => ({
    label: labelOf.get(c.category)?.label ?? c.category,
    pct: demandTotal ? Math.round((c.count / demandTotal) * 100) : 0,
    color: DONUT_COLORS[i] as string,
  }));
  // Build the cumulative conic-gradient stops for the donut from the real percentages.
  let acc = 0;
  const donutStops = legend
    .map((l) => {
      const start = acc;
      acc += l.pct;
      return `${l.color} ${start}% ${acc}%`;
    })
    .join(", ");
  const donutBg = demandTotal
    ? `conic-gradient(${donutStops}${acc < 100 ? `, #C9C2AE ${acc}% 100%` : ""})`
    : "conic-gradient(#E7E0CF 0 100%)";
  const leadPct = legend[0]?.pct ?? 0;
  const leadLabel = legend[0]?.label ?? "—";

  // ── Gauge: half-circle, lime arc filled to the real Perx Score. The design maps the
  // score value 1:1 to degrees of the 180° visible arc (e.g. 92 → 92deg), so we do the same.
  const gaugeDeg = Math.min(180, Math.max(0, ins.perxScore));
  const gaugeBg = `conic-gradient(from 270deg, var(--lime) 0 ${gaugeDeg}deg, #ffffff1a ${gaugeDeg}deg 180deg, transparent 180deg)`;

  // Real scorecard sub-metrics, derived from companyInsights (no mock numbers).
  const subScores = [
    { k: "Budget utilization", v: Math.min(100, budgetPct), label: `${budgetPct} / 100`, coral: false },
    { k: "Employee engagement", v: ins.engagementPct, label: `${ins.engagementPct} / 100`, coral: false },
    { k: "Pulse participation", v: ins.participationPct, label: `${ins.participationPct} / 100`, coral: false },
    { k: "Provider diversity", v: Math.round((providerCats / 8) * 100), label: `${providerCats} / 8`, coral: false },
  ];

  return (
    <main className="page" style={{ maxWidth: 920 }}>
      <div className="sub kicker text-coral">ANONYMOUS · AGGREGATED · NO SPYING</div>
      <h1 className="h1">Heatmap</h1>
      <p className="text-muted" style={{ maxWidth: 480 }}>
        Know what your people value — without spying. Every number is anonymous and aggregated across {ins.headcount} employee{ins.headcount === 1 ? "" : "s"}.
      </p>

      {/* ── Perx Score: scorecard with gauge + sub-metrics ── */}
      <div className="grid g-2" style={{ marginTop: 20, alignItems: "start" }}>
        <div className="scorecard">
          <div className="kicker" style={{ color: "var(--lime)" }}>OVERALL SCORE</div>
          <div className="gauge">
            <div
              style={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: gaugeBg,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 25,
                top: 25,
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: "var(--ink)",
              }}
            />
          </div>
          <div className="num" style={{ marginTop: -46, position: "relative", zIndex: 2 }}>{ins.perxScore}</div>
          <div style={{ color: "#fff9", margin: "8px 0 14px" }}>out of 100</div>
          <span className="badge" style={{ background: verdict.tone, color: "var(--ink)" }}>{verdict.label.toUpperCase()}</span>
        </div>
        <div>
          <div className="card">
            {subScores.map((s, i) => (
              <div key={s.k} className="metric" style={i === subScores.length - 1 ? { margin: 0 } : undefined}>
                <div className="top"><span className="k">{s.k}</span><span>{s.label}</span></div>
                <div className={`bar ${s.coral ? "coral" : ""}`}><i style={{ width: `${Math.min(100, s.v)}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", background: "var(--lime-soft)", borderColor: "#E3EBBE" }}>
            <Mascot mood="cheer" size={56} />
            <div style={{ fontSize: 14 }}>
              <b>Coins moved this month:</b> {ins.coinsMovedThisMonth.toLocaleString("en-US")}. Add more provider categories to lift diversity and your score.
            </div>
          </div>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid g-3" style={{ marginTop: 18 }}>
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

      {/* ── Heatmap: donut + legend, AI insight, mood bars ── */}
      <div className="grid g-2" style={{ marginTop: 20 }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 className="display" style={{ fontSize: 18, alignSelf: "flex-start" }}>Where the demand is</h3>
          <div className="donut" style={{ marginTop: 18, background: donutBg }}>
            <div className="c">{leadPct}%</div>
          </div>
          <div style={{ width: "100%", marginTop: 18 }}>
            {legend.length === 0 || demandTotal === 0 ? (
              <p className="py-2 text-center text-sm text-muted">No demand signal yet.</p>
            ) : (
              legend.map((l, i) => (
                <div key={l.label} className="leg" style={i === legend.length - 1 ? { border: "none" } : undefined}>
                  <span className="sw" style={{ background: l.color }} />
                  {l.label}
                  <span className="pc">{l.pct}%</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="card" style={{ background: "var(--ink)", color: "#fff" }}>
            <div className="kicker" style={{ color: "var(--lime)" }}>AI INSIGHT</div>
            <div style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 4px" }}>
              {demandTotal ? `${leadLabel} leads your team's demand.` : "No demand signal yet — encourage your team to redeem."}
            </div>
            <p style={{ color: "#fff9", fontSize: 14 }}>
              Fund more providers where demand is highest to keep your Perx Score climbing.
            </p>
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <div className="kicker">BUDGET UTILIZATION</div>
            <div style={{ fontSize: 18, fontWeight: 700, margin: "6px 0" }}>
              {toCoins(ins.budgetUsed).toLocaleString("en-US")} of {toCoins(ins.budgetTotal).toLocaleString("en-US")} coins · {budgetPct}%
            </div>
            <div className="bar coral"><i style={{ width: `${Math.min(100, budgetPct)}%` }} /></div>
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <h3 className="display" style={{ fontSize: 16, marginBottom: 10 }}>How the team&apos;s week felt</h3>
            {ins.moods.every((x) => x.count === 0) ? (
              <p className="py-2 text-center text-sm text-muted">No pulses yet.</p>
            ) : (
              ins.moods.map((x, i) => (
                <div key={x.mood} className="metric" style={i === ins.moods.length - 1 ? { margin: 0 } : undefined}>
                  <div className="top"><span className="k">{x.mood}</span><span>{x.count}</span></div>
                  <div className="bar"><i style={{ width: `${(x.count / maxMood) * 100}%`, background: MOOD_COLOR[x.mood] }} /></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category demand heatmap tiles */}
      <div className="sec"><h3>Category demand</h3></div>
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
