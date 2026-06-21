"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTeamPack, joinTeamPack, leaveTeamPack } from "@/lib/team-actions";

type OfferChoice = { id: string; title: string; providerName: string; coins: number };

export function CreateTeamPack({ offers }: { offers: OfferChoice[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    const input = {
      title: formData.get("title"),
      description: formData.get("description"),
      targetSize: formData.get("targetSize"),
      offerId: formData.get("offerId"),
    };
    startTransition(async () => {
      const res = await createTeamPack(input);
      if (res.error) setError(res.error);
      else { setOpen(false); router.refresh(); }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-lg">
        + Start a team pack
      </button>
    );
  }
  return (
    <form action={submit} className="card space-y-3">
      <div className="field !mb-0">
        <label>Title</label>
        <input name="title" placeholder="Friday 5-a-side football" required />
      </div>
      <div className="field !mb-0">
        <label>Attach a perk (optional)</label>
        <select name="offerId" defaultValue="">
          <option value="">No perk — just an activity</option>
          {offers.map((o) => (
            <option key={o.id} value={o.id}>{o.title} — {o.providerName} ({o.coins} coins)</option>
          ))}
        </select>
      </div>
      <div className="field !mb-0">
        <label>Plan</label>
        <input name="description" placeholder="What's the plan? (optional)" />
      </div>
      <div className="field !mb-0">
        <label>How many people to unlock the group rate?</label>
        <input name="targetSize" type="number" min={2} max={50} defaultValue={6} required />
      </div>
      <p className="text-xs text-muted">When the group fills, everyone earns bonus PerxCoins you don&apos;t get buying solo.</p>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending} className="btn btn-primary flex-1 disabled:opacity-60">{pending ? "Creating…" : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
      </div>
      {error && <p className="text-sm text-coral">{error}</p>}
    </form>
  );
}

export function JoinLeaveButton({ teamPackId, joined, full, locked }: { teamPackId: string; joined: boolean; full: boolean; locked: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const disabled = pending || (!joined && full) || (joined && locked);
  return (
    <div className="flex shrink-0 flex-col items-end">
      <button
        type="button"
        disabled={disabled}
        onClick={() => startTransition(async () => {
          const res = joined ? await leaveTeamPack(teamPackId) : await joinTeamPack(teamPackId);
          if (res?.error) setError(res.error);
          else { setError(null); router.refresh(); }
        })}
        className={`disabled:opacity-50 ${joined ? "chip" : "btn btn-primary !px-5 !py-2.5 !text-sm"}`}
      >
        {pending ? "…" : joined ? (locked ? "Joined ✓" : "Leave") : full ? "Full" : "Join"}
      </button>
      {error && <span className="mt-1 max-w-[150px] text-right text-[11px] text-coral">{error}</span>}
    </div>
  );
}
