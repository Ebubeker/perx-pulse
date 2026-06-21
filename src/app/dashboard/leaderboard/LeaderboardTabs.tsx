"use client";

import { useState } from "react";
import type { Ranked } from "@/lib/leaderboard";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { CoinIcon } from "@/components/CoinIcon";

// Top-3 medal tints (gold / silver / bronze) for the leaderboard rank icons.
const MEDAL_COLOR = ["text-[#E8B339]", "text-[#9AA0A6]", "text-[#CD7F32]"];
// Podium bar fills + heights, design order = [silver(2), gold(1), bronze(3)].
const PODIUM = [
  { rank: 2, height: 74, bg: "#C9C2AE", color: "#fff" },
  { rank: 1, height: 98, bg: "var(--lime)", color: "var(--ink)" },
  { rank: 3, height: 58, bg: "#D8B48C", color: "#fff" },
] as const;

function Board({ subtitle, rows, meId }: { subtitle: string; rows: Ranked[]; meId: string }) {
  // Reorder the top-3 for the podium so #1 sits in the middle: [2nd, 1st, 3rd].
  const podium = [rows[1], rows[0], rows[2]];

  if (rows.length === 0) {
    return <p className="mt-3 rounded-[18px] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No activity yet.</p>;
  }

  return (
    <div>
      <div className="sec">
        <h3>{subtitle}</h3>
      </div>
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
    </div>
  );
}

export function LeaderboardTabs({ earners, givers, meId }: { earners: Ranked[]; givers: Ranked[]; meId: string }) {
  const [tab, setTab] = useState<"recognized" | "generous">("recognized");

  return (
    <>
      <div className="seg">
        <button className={tab === "recognized" ? "on" : ""} onClick={() => setTab("recognized")}>Most recognized</button>
        <button className={tab === "generous" ? "on" : ""} onClick={() => setTab("generous")}>Most generous</button>
      </div>

      {tab === "recognized" ? (
        <Board subtitle="Coins earned all-time" rows={earners} meId={meId} />
      ) : (
        <Board subtitle="Kudos given this month" rows={givers} meId={meId} />
      )}
    </>
  );
}
