"use client";

import { useState, useTransition } from "react";
import { askCompanyData } from "@/lib/company-ai-actions";
import { Icon } from "@/components/Icon";

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "What does my team want this month?",
  "Who hasn't used their coins?",
  "How does each team feel right now?",
  "What perks should I add next?",
];

export function CompanyChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  function send(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    startTransition(async () => {
      const r = await askCompanyData(q);
      setMessages((m) => [...m, { role: "ai", text: r.answer }]);
    });
  }

  return (
    <div className="card flex flex-col">
      <div className="flex items-center gap-2">
        <span className="ico shrink-0"><Icon name="genie" size={20} /></span>
        <div>
          <div className="kicker">Ask your team data</div>
          <h3 className="font-display text-lg font-extrabold leading-tight">Talk to your analytics</h3>
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Ask anything about your people — wellbeing, demand, spend, who to recognize. Answered live from your data and Perx&apos;s memory of each employee.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="max-w-[85%] self-end rounded-[16px] rounded-br-md bg-coral px-3.5 py-2 text-sm text-white">{msg.text}</div>
            ) : (
              <div key={i} className="max-w-[92%] self-start whitespace-pre-wrap rounded-[16px] rounded-bl-md border border-line bg-paper px-3.5 py-2.5 text-sm leading-relaxed">{msg.text}</div>
            )
          )}
          {pending && (
            <div className="self-start rounded-[16px] rounded-bl-md border border-line bg-paper px-3.5 py-2.5 text-sm text-muted">Analyzing…</div>
          )}
        </div>
      )}

      <div className="chip-row mt-3">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => send(s)} disabled={pending} className="chip text-[13px] disabled:opacity-50">{s}</button>
        ))}
      </div>

      <div className="field-inline mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder="Ask about your team…"
        />
        <button type="button" onClick={() => send(input)} disabled={pending || !input.trim()} aria-label="Ask" className="send disabled:opacity-50">↑</button>
      </div>
    </div>
  );
}
