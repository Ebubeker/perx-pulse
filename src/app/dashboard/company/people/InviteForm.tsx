"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { inviteEmployee } from "@/lib/invite-actions";

const inputCls = "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[15px] outline-none focus:border-primary";

export function InviteForm({ departments }: { departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [departmentId, setDept] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await inviteEmployee({ email, departmentId: departmentId || undefined, role });
      if ("error" in res) {
        setMsg({ error: res.error });
      } else {
        setMsg({ ok: true });
        setEmail("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inputCls} type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div className="flex gap-3">
        <select className={inputCls} value={departmentId} onChange={(e) => setDept(e.target.value)}>
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="EMPLOYEE">Employee</option>
          <option value="HR">HR</option>
          <option value="FINANCE">Finance</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50">
        {pending ? "Sending…" : "Send invite"}
      </button>
      {msg?.ok && <p className="text-sm font-medium text-primary">Invite sent.</p>}
      {msg?.error && <p className="text-sm font-medium text-accent">{msg.error}</p>}
    </form>
  );
}
