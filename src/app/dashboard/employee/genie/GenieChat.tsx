"use client";

import { useState, useTransition } from "react";
import { genieAsk, type GenieResult } from "@/lib/genie-actions";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Mascot } from "@/components/Mascot";

type Msg = { role: "user" | "genie"; text: string; offers?: GenieResult["offers"] };

const SUGGESTIONS = [
  "I had a brutal week, help me unwind",
  "Best way to spend 5000 lek near home?",
  "Something healthy for lunch this week",
];

export function GenieChat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "genie", text: "Hi, I'm Perx Genie ✨ Tell me how your week is going or what you're in the mood for, and I'll find the perfect perk." },
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
    <div className="mt-5">
      <div className="space-y-3">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-[18px] rounded-br-md bg-ink px-4 py-3 text-sm text-[var(--txt-on-dark)]">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={i} className="space-y-2">
              {msg.text && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-[18px] rounded-bl-md border border-line bg-paper px-4 py-3 text-sm">
                    {msg.text}
                  </div>
                </div>
              )}
              {msg.offers && msg.offers.length > 0 && (
                <div className="pack fade-up">
                  <div className="pack-top coral">
                    <div className="kk">Genie Pick · {msg.offers.length} providers</div>
                    <h2>Your pack</h2>
                  </div>
                  <div className="pack-body">
                    <ul className="space-y-1.5">
                      {msg.offers.map((o) => (
                        <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate">
                            <span className="font-medium">{o.title}</span>{" "}
                            <span className="text-muted">· {o.providerName}</span>
                          </span>
                          <span className="shrink-0 font-semibold text-ink-soft"><Coins amount={toCoins(o.effLek)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        )}
        {pending && (
          <div className="flex items-center justify-start gap-2">
            <Mascot mood="thinking" size={34} />
            <div className="rounded-[18px] rounded-bl-md border border-line bg-paper px-4 py-3 text-sm text-muted">Genie is thinking…</div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="chip-row mt-4">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="chip text-[13px]">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-full border-[1.5px] border-line bg-paper py-1.5 pl-4 pr-1.5 shadow-soft">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder="Ask Perx Genie…"
          className="min-w-0 flex-1 border-none bg-transparent text-[15px] focus:outline-none"
        />
        <button
          onClick={() => send(input)}
          disabled={pending || !input.trim()}
          aria-label="Ask Perx Genie"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-coral text-white disabled:opacity-50"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
