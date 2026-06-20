"use client";

import { useState, useTransition } from "react";
import { genieAsk, type GenieResult } from "@/lib/genie-actions";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";

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
    <div className="mt-6">
      <div className="space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-white" : "border border-line bg-paper"}`}>
              <p>{msg.text}</p>
              {msg.offers && msg.offers.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {msg.offers.map((o) => (
                    <li key={o.id} className="rounded-lg bg-cream px-3 py-2 text-xs">
                      <span className="font-semibold">{o.title}</span> · {o.providerName}
                      <span className="float-right font-bold text-ink-soft"><Coins amount={toCoins(o.effLek)} /></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {pending && <div className="flex justify-start"><div className="rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm text-muted">Genie is thinking…</div></div>}
      </div>

      {messages.length <= 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium hover:border-primary">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder="Ask Perx Genie…"
          className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-3 text-sm"
        />
        <button onClick={() => send(input)} disabled={pending || !input.trim()} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">
          Ask
        </button>
      </div>
    </div>
  );
}
