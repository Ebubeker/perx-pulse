"use client";

import { useEffect, useState } from "react";
import { getCompanyBrief } from "@/lib/company-ai-actions";

type Brief = { summary: string; actions: string[] };

export function CompanyBrief() {
  const [data, setData] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    getCompanyBrief()
      .then((d) => { if (on) { setData(d); setLoading(false); } })
      .catch(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  return (
    <div className="card" style={{ background: "var(--ink)", color: "#fff" }}>
      <div className="kicker" style={{ color: "var(--lime)" }}>AI TEAM BRIEF</div>

      {loading ? (
        <div className="animate-pulse" style={{ marginTop: 12 }}>
          {["92%", "78%", "85%"].map((w, i) => (
            <div key={i} style={{ width: w, height: 10, borderRadius: 6, background: "#ffffff26", marginBottom: 8 }} />
          ))}
          <p style={{ color: "#fff8", fontSize: 12, marginTop: 6 }}>Analyzing your team…</p>
        </div>
      ) : !data ? (
        <p style={{ color: "#fff9", fontSize: 14, marginTop: 8 }}>Not enough activity yet to summarize.</p>
      ) : (
        <>
          <p style={{ fontSize: 15, fontWeight: 600, margin: "8px 0 12px", lineHeight: 1.5 }}>{data.summary}</p>
          {data.actions.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {data.actions.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.45 }}>
                  <span style={{ color: "var(--lime)", fontWeight: 700 }}>→</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
