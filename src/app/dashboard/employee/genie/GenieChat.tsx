"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { genieAsk, type GenieResult } from "@/lib/genie-actions";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";

type Offers = GenieResult["offers"];
type Msg = { role: "user" | "genie"; text: string; offers?: Offers };

const SUGGESTIONS = [
  "I had a brutal week, help me unwind",
  "Best way to spend 5000 lek near home?",
  "Something healthy for lunch this week",
];

// genie returns a .pack card (design 14-genie.html)
function GeniePack({ offers }: { offers: Offers }) {
  const totalLek = offers.reduce((s, o) => s + o.effLek, 0);
  const taxFree = offers.length > 0 && offers.every((o) => o.taxFree);
  const providers = Array.from(new Set(offers.map((o) => o.providerName)));
  const rationale = offers.length
    ? `${offers.length === 1 ? "One pick" : `${offers.length} picks`} that fit, low effort and on budget.`
    : "";

  return (
    <div className="pack fade-up" style={{ marginTop: "6px" }}>
      <div className="pack-top coral">
        <span className="pack-arrow">↗</span>
        <div className="kk">GENIE PICK</div>
        <h2>Your pack</h2>
      </div>
      <div className="pack-body">
        <div className="why"><span className="spark"><Icon name="sparkles" size={15} /></span><span>{rationale}</span></div>
        {providers.length > 0 && (
          <div className="chip-row" style={{ marginBottom: "14px" }}>
            {providers.map((name) => <span key={name} className="provchip">{name}</span>)}
          </div>
        )}
        <div className="pack-foot">
          <span className="muted">{taxFree && <span className="badge badge-tax">TAX-FREE</span>}</span>
          <span className="price"><Coins amount={toCoins(totalLek)} /></span>
        </div>
      </div>
    </div>
  );
}

export function GenieChat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "genie", text: "Hi, I'm Perx Genie. Tell me what you're in the mood for and I'll put together a pack for you." },
  ]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  function send(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    startTransition(async () => {
      const res = await genieAsk(q);
      if (res.error) setMessages((m) => [...m, { role: "genie", text: res.error! }]);
      else setMessages((m) => [...m, { role: "genie", text: res.answer ?? "", offers: res.offers }]);
    });
  }

  return (
    <div className="mt-4 flex flex-1 flex-col">
      {/* message stream */}
      <div>
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="ask my-2.5">{msg.text}</div>
          ) : (
            <div key={i}>
              {msg.text && (
                <div className="my-2.5 max-w-[85%] rounded-[18px] rounded-bl-md border border-line bg-paper px-4 py-3 text-sm">
                  {msg.text}
                </div>
              )}
              {msg.offers && msg.offers.length > 0 && (
                <>
                  <GeniePack offers={msg.offers} />
                  <Link href={`/dashboard/employee/offer/${msg.offers[0]!.id}`} className="btn btn-soft" style={{ marginTop: "12px" }}>
                    View &amp; tweak this pack
                  </Link>
                </>
              )}
            </div>
          )
        )}
        {pending && (
          <div className="mt-2.5 flex items-center gap-2">
            <Mascot mood="thinking" size={34} />
            <div className="rounded-[18px] rounded-bl-md border border-line bg-paper px-4 py-3 text-sm text-muted">Genie is thinking…</div>
          </div>
        )}
      </div>

      {/* suggestion chips sit right under the intro */}
      {messages.length <= 1 && (
        <div className="chip-row mt-4">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="chip text-[13px]">{s}</button>
          ))}
        </div>
      )}

      {/* spacer pushes the input to the bottom */}
      <div className="flex-1" />

      {/* composer pinned to the bottom */}
      <div className="pt-3">
        {/* .field-inline input with round .send button */}
        <div className="field-inline">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder="Ask Pulse anything…"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={pending || !input.trim()}
            aria-label="Ask Perx Genie"
            className="send disabled:opacity-50"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
