import { requireMembership } from "@/lib/account";
import { topEarners, topGivers, type Ranked } from "@/lib/leaderboard";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { CoinIcon } from "@/components/CoinIcon";

export const dynamic = "force-dynamic";

// Top-3 medal tints (gold / silver / bronze) for the leaderboard rank icons.
const MEDAL_COLOR = ["text-[#E8B339]", "text-[#9AA0A6]", "text-[#CD7F32]"];
// Podium bar fills + heights, design order = [silver(2), gold(1), bronze(3)].
const PODIUM = [
  { rank: 2, height: 74, bg: "#C9C2AE", color: "#fff" },
  { rank: 1, height: 98, bg: "var(--lime)", color: "var(--ink)" },
  { rank: 3, height: 58, bg: "#D8B48C", color: "#fff" },
] as const;

function Board({ title, subtitle, rows, meId }: { title: string; subtitle: string; rows: Ranked[]; meId: string }) {
  // Reorder the top-3 for the podium so #1 sits in the middle: [2nd, 1st, 3rd].
  const podium = [rows[1], rows[0], rows[2]];

  return (
    <div>
      <div className="sec">
        <h3>{title}</h3>
        <span className="link">{subtitle}</span>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No activity yet.</p>
      ) : (
        <>
          <div className="podium">
            {PODIUM.map((p, idx) => {
              const r = podium[idx];
              return (
                <div className="pod" key={p.rank}>
                  {r ? <Avatar name={r.name} seed={r.id} size={54} className="mx-auto mb-1.5" /> : <span className="mx-auto mb-1.5 block size-[54px] rounded-full bg-line" />}
                  <div className="medal">{p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"}</div>
                  <div className="pbar" style={{ height: p.height, background: p.bg, color: p.color }}>{p.rank}</div>
                </div>
              );
            })}
          </div>

          <div>
            {rows.map((r, i) => {
              const top3 = i < 3;
              const me = r.id === meId;
              return (
                <div key={r.id} className={`lb-row ${me ? "me" : ""}`}>
                  <span className="lb-rank">
                    {top3 ? <Icon name="medal" size={22} className={`medal ${MEDAL_COLOR[i]}`} /> : i + 1}
                  </span>
                  <Avatar name={r.name} seed={r.id} size={38} />
                  <div className="grow">
                    <div className="font-bold">{r.name}{me ? " · you" : ""}</div>
                  </div>
                  <span className="coin sm">
                    <CoinIcon /> {r.value.toLocaleString("en-US")}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default async function LeaderboardPage() {
  const m = await requireMembership();
  const [earners, givers] = await Promise.all([topEarners(m.companyId), topGivers(m.companyId)]);

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day flex items-center gap-1.5"><Icon name="trophy" size={13} />Leaderboard</div>
          <h1>{m.company.brandName || m.company.name}</h1>
        </div>
        <Mascot mood="excited" size={58} className="float" />
      </div>

      {/* Segmented toggle from the design — both boards stay rendered below it. */}
      <div className="seg">
        <button className="on">Most recognized</button>
        <button>Most generous</button>
      </div>

      <div className="space-y-2">
        <Board title="Most recognized" subtitle="Coins earned all-time" rows={earners} meId={m.id} />
        <Board title="Most generous" subtitle="Kudos given this month" rows={givers} meId={m.id} />
      </div>
    </main>
  );
}
