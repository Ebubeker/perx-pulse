import { requireMembership } from "@/lib/account";
import { topEarners, topGivers } from "@/lib/leaderboard";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { LeaderboardTabs } from "./LeaderboardTabs";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const m = await requireMembership();
  const [earners, givers] = await Promise.all([topEarners(m.companyId), topGivers(m.companyId)]);

  return (
    <main className="mx-auto max-w-md px-5 py-5 md:max-w-5xl md:px-8 md:py-7">
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day flex items-center gap-1.5"><Icon name="trophy" size={13} />Leaderboard</div>
          <h1>{m.company.brandName || m.company.name}</h1>
        </div>
        <Mascot mood="excited" size={58} className="float" />
      </div>

      <LeaderboardTabs earners={earners} givers={givers} meId={m.id} />
    </main>
  );
}
