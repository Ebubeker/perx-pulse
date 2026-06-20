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

// Split the soonest countdown into HH:MM:SS chips for the .count row.
function countChips(endsAt: Date): [string, string, string] {
  const ms = Math.max(0, endsAt.getTime() - Date.now());
  const h = Math.floor(ms / 3_600_000);
  const min = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return [pad(Math.min(h, 99)), pad(min), pad(s)];
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
  const chips = soonest ? countChips(soonest.endsAt) : null;

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      <div className="topbar">
        <h2 className="flex items-center gap-2"><Icon name="bolt" size={22} className="text-coral" />Perx Drops</h2>
        <Mascot mood="excited" size={52} />
        <span className="pill pill-live"><span className="dot pulse-dot" />Live</span>
      </div>

      <div className="drophero">
        <div className="kk">FRIDAY · TIRANA EDITION</div>
        <h1>{drops.length} local drop{drops.length === 1 ? "" : "s"},<br />gone in a flash</h1>
        {chips ? (
          <>
            <div className="count"><b>{chips[0]}</b>:<b>{chips[1]}</b>:<b>{chips[2]}</b></div>
            <span className="muted" style={{ color: "#fff9", fontSize: 12, marginLeft: 8 }}>left to claim</span>
          </>
        ) : (
          <div className="count"><b>00</b>:<b>00</b>:<b>00</b></div>
        )}
      </div>

      {drops.length === 0 && (
        <div className="card" style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", background: "var(--coral-soft)", borderColor: "#F4D7CE" }}>
          <Mascot mood="sleepy" size={52} />
          <div style={{ fontSize: 14 }}><b>No live drops right now.</b> Check back soon for flash perks.</div>
        </div>
      )}

      {drops.map((d) => {
        const claimedCode = claimedById.get(d.id);
        const left = d.totalSlots - d.claimedSlots;
        const soldOut = left <= 0;
        const tooPoor = m.recognitionCoins < d.costCoins;
        const phBg = PH_BG[d.category] ?? "var(--cream)";
        return (
          <div className="dropcard" key={d.id} style={{ marginTop: 14 }}>
            <div className="ph" style={{ background: phBg }}><Icon name={d.category} size={46} className="text-ink/70" /></div>
            <div className="bd">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>{d.title}</b>
                <span className="badge badge-new"><Coins amount={d.costCoins} /></span>
              </div>
              <div className="muted" style={{ fontSize: 13, margin: "4px 0 10px" }}>
                {d.provider.businessName}{d.area ? ` · ${d.area}` : ""}{d.description ? ` — ${d.description}` : ""}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="timer">
                  <Icon name="clock" size={13} className="inline align-[-2px] mr-1" />
                  {d.claimedSlots > 0 ? `${d.claimedSlots} claimed · ` : ""}{soldOut ? "sold out" : `${left} left`} · {endsIn(d.endsAt)}
                </span>
                {claimedCode ? (
                  <span className="pill pill-ready"><span className="dot pulse-dot" />Claimed · {claimedCode}</span>
                ) : soldOut ? (
                  <span className="pill pill-redeemed"><span className="dot" />Sold out</span>
                ) : (
                  <ClaimButton dropId={d.id} disabled={tooPoor} />
                )}
              </div>
              {!claimedCode && !soldOut && tooPoor && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Earn more coins to claim this.</p>}
            </div>
          </div>
        );
      })}
    </main>
  );
}
