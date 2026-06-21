"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { genieAsk, listGenieConversations, getGenieConversation, type ConvMeta } from "@/lib/genie-actions";
import type { CatalogOffer } from "@/lib/gemini";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";

type Msg = { role: "user" | "genie"; text: string; offers?: CatalogOffer[] };

const INTRO: Msg = { role: "genie", text: "Hi, I'm Perx Genie. Tell me what you're in the mood for and I'll put together a pack for you." };

const SUGGESTIONS = [
  "I had a brutal week, help me unwind",
  "Best way to spend 5000 lek near home?",
  "Something healthy for lunch this week",
];

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Genie picks rendered as the SAME coupon cards as the home Browse perks.
function OfferCoupon({ o }: { o: CatalogOffer }) {
  return (
    <Link
      href={`/dashboard/employee/offer/${o.id}`}
      className="relative flex aspect-[2/1] flex-col justify-end overflow-hidden rounded-2xl bg-coral shadow-soft transition active:scale-[.99]"
    >
      {o.imageUrl && <Image src={o.imageUrl} alt="" fill sizes="(min-width:768px) 480px, 100vw" unoptimized className="object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="coupon-tex pointer-events-none absolute inset-0 z-[1]" />
      {o.discountPct > 0 && <span className="badge badge-new absolute left-3 top-3 z-[2]">−{o.discountPct}%</span>}
      <span className="absolute right-3 top-3 z-[2] inline-flex items-center rounded-full bg-coral px-3 py-1.5 font-display text-sm font-bold text-white shadow-[var(--sh-press)]"><Coins amount={toCoins(o.effLek)} /></span>
      <div className="relative z-[2] p-3.5 text-white">
        <div className="line-clamp-1 font-display text-base font-bold leading-tight">{o.title}</div>
        <div className="truncate text-xs text-white/85">{o.providerName}{o.area ? ` · ${o.area}` : ""}</div>
      </div>
    </Link>
  );
}

function GeniePick({ offers }: { offers: CatalogOffer[] }) {
  const total = toCoins(offers.reduce((s, o) => s + o.effLek, 0));
  const providers = new Set(offers.map((o) => o.providerName)).size;
  const taxFree = offers.length > 0 && offers.every((o) => o.taxFree);
  return (
    <div className="mt-2 space-y-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-coral-deep">
        <span className="inline-flex items-center gap-1"><Icon name="sparkles" size={13} /> Genie pick</span>
        <span className="text-muted">· {providers} provider{providers === 1 ? "" : "s"} ·</span>
        <span className="inline-flex items-center">total&nbsp;<Coins amount={total} /></span>
        {taxFree && <span className="badge badge-tax">Tax-free</span>}
      </div>
      {offers.map((o) => <OfferCoupon key={o.id} o={o} />)}
    </div>
  );
}

export function GenieChat() {
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [convs, setConvs] = useState<ConvMeta[] | null>(null);
  const [loadingConv, setLoadingConv] = useState(false);

  function send(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    startTransition(async () => {
      const res = await genieAsk(q, conversationId ?? undefined);
      if (res.error) setMessages((m) => [...m, { role: "genie", text: res.error! }]);
      else {
        if (res.conversationId) setConversationId(res.conversationId);
        setMessages((m) => [...m, { role: "genie", text: res.answer ?? "", offers: res.offers }]);
      }
    });
  }

  async function openHistory() {
    setShowHistory(true);
    setConvs(null);
    setConvs(await listGenieConversations());
  }

  async function loadConv(id: string) {
    setLoadingConv(true);
    const res = await getGenieConversation(id);
    setLoadingConv(false);
    if (res.messages) {
      setMessages(res.messages.map((t) => ({ role: t.role, text: t.text, offers: t.offers })));
      setConversationId(id);
      setShowHistory(false);
    }
  }

  function newChat() {
    setMessages([INTRO]);
    setConversationId(null);
  }

  return (
    <div className="mt-3 flex flex-1 flex-col">
      {/* toolbar — new chat + history */}
      <div className="mb-2 flex items-center justify-end gap-2">
        <button type="button" onClick={newChat} className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-coral/50">
          <Icon name="sparkles" size={13} /> New chat
        </button>
        <button type="button" onClick={openHistory} className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-coral/50">
          <Icon name="clock" size={13} /> History
        </button>
      </div>

      {/* message stream — flex column so user bubbles sit right, genie left */}
      <div className="flex flex-col gap-1">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="ask my-1.5">{msg.text}</div>
          ) : (
            <div key={i} className="my-1.5 max-w-[85%] self-start md:max-w-lg">
              {msg.text && (
                <div className="rounded-[18px] rounded-bl-md border border-line bg-paper px-4 py-3 text-sm">{msg.text}</div>
              )}
              {msg.offers && msg.offers.length > 0 && <GeniePick offers={msg.offers} />}
            </div>
          )
        )}
        {pending && (
          <div className="my-1.5 flex items-center gap-2 self-start">
            <Mascot mood="thinking" size={34} />
            <div className="rounded-[18px] rounded-bl-md border border-line bg-paper px-4 py-3 text-sm text-muted">Genie is thinking…</div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="chip-row mt-4">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="chip text-[13px]">{s}</button>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* composer */}
      <div className="pt-3">
        <div className="field-inline">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder="Ask Pulse anything…"
          />
          <button type="button" onClick={() => send(input)} disabled={pending || !input.trim()} aria-label="Ask Perx Genie" className="send disabled:opacity-50">↑</button>
        </div>
      </div>

      {/* history drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setShowHistory(false)}>
          <div className="h-full w-full max-w-sm overflow-y-auto border-l border-line bg-paper p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">Your conversations</h3>
              <button type="button" onClick={() => setShowHistory(false)} aria-label="Close" className="grid size-8 place-items-center rounded-full text-muted hover:bg-cream"><Icon name="x" size={18} /></button>
            </div>
            {convs === null ? (
              <p className="mt-5 text-sm text-muted">Loading…</p>
            ) : convs.length === 0 ? (
              <p className="mt-5 text-sm text-muted">No saved conversations yet. Ask Genie something and it&apos;ll be saved here.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {convs.map((c) => (
                  <button key={c.id} type="button" onClick={() => loadConv(c.id)} disabled={loadingConv} className="block w-full rounded-xl border border-line bg-cream/50 p-3 text-left transition hover:border-coral/50 disabled:opacity-50">
                    <div className="line-clamp-1 text-sm font-semibold text-ink">{c.title}</div>
                    <div className="mt-0.5 text-xs text-muted">{c.count} message{c.count === 1 ? "" : "s"} · {relTime(c.updatedAt)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
