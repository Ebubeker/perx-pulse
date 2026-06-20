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
        <label>Plan</label>
        <input name="description" placeholder="What's the plan? (optional)" />
      </div>
      <div className="field !mb-0">
        <label>Target size</label>
        <input name="targetSize" type="number" min={2} max={50} defaultValue={6} required />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending} className="btn btn-primary flex-1 disabled:opacity-60">{pending ? "Creating…" : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
      </div>
      {error && <p className="text-sm text-coral">{error}</p>}
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
      className={`shrink-0 disabled:opacity-50 ${joined ? "chip" : "btn btn-primary !px-5 !py-2.5 !text-sm"}`}
    >
      {pending ? "…" : joined ? "Leave" : full ? "Full" : "Join"}
    </button>
  );
}
