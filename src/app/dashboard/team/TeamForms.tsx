"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTeamPack, joinTeamPack, leaveTeamPack } from "@/lib/team-actions";

export function CreateTeamPack() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    const input = { title: formData.get("title"), description: formData.get("description"), targetSize: formData.get("targetSize") };
    startTransition(async () => {
      const res = await createTeamPack(input);
      if (res.error) setError(res.error);
      else { setOpen(false); router.refresh(); }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-xl bg-primary py-3 font-semibold text-white">
        + Start a team pack
      </button>
    );
  }
  return (
    <form action={submit} className="space-y-3 rounded-2xl border border-line bg-paper p-5">
      <input name="title" placeholder="Friday 5-a-side football ⚽" required className="w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm" />
      <input name="description" placeholder="What's the plan? (optional)" className="w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm" />
      <label className="block text-xs text-muted">Target size
        <input name="targetSize" type="number" min={2} max={50} defaultValue={6} required className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm" />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-primary py-2.5 font-semibold text-white disabled:opacity-60">{pending ? "Creating…" : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted">Cancel</button>
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
    </form>
  );
}

export function JoinLeaveButton({ teamPackId, joined, full }: { teamPackId: string; joined: boolean; full: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending || (!joined && full)}
      onClick={() => startTransition(async () => {
        if (joined) await leaveTeamPack(teamPackId);
        else await joinTeamPack(teamPackId);
        router.refresh();
      })}
      className={`rounded-lg px-4 py-1.5 text-sm font-semibold disabled:opacity-50 ${joined ? "border border-line text-muted" : "bg-primary text-white"}`}
    >
      {pending ? "…" : joined ? "Leave" : full ? "Full" : "Join"}
    </button>
  );
}
