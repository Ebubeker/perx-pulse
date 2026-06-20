import { requireMembership } from "@/lib/account";
import { topEarners, topGivers, type Ranked } from "@/lib/leaderboard";
import { Mascot } from "@/components/Mascot";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "•";
}

function Board({ title, subtitle, rows, unit, meId }: { title: string; subtitle: string; rows: Ranked[]; unit: string; meId: string }) {
  return (
    <div>
      <div className="sec">
        <h3>{title}</h3>
        <span className="link">{subtitle}</span>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No activity yet.</p>
      ) : (
        <div>
          {rows.map((r, i) => {
            const medal = MEDALS[i];
            const me = r.id === meId;
            return (
              <div key={r.id} className={`lb-row ${me ? "me" : ""}`}>
                <span className={`lb-rank ${medal ? "medal" : ""}`}>{medal ?? i + 1}</span>
                <span className="avatar">{initial(r.name)}</span>
                <div className="grow">
                  <div className="font-bold">{r.name}{me ? " · you" : ""}</div>
                </div>
                <span className="coin sm">{r.value.toLocaleString("en-US")} {unit}</span>
              </div>
            );
          })}
        </div>
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
          <div className="day">🏆 Leaderboard</div>
          <h1>{m.company.brandName || m.company.name}</h1>
        </div>
        <Mascot mood="celebrate" size={62} className="float" />
      </div>

      <div className="mt-4 space-y-2">
        <Board title="Most recognized" subtitle="Coins earned all-time" rows={earners} unit="coins" meId={m.id} />
        <Board title="Most generous" subtitle="Kudos given this month" rows={givers} unit="given" meId={m.id} />
      </div>
    </main>
  );
}
