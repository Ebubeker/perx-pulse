"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { inviteEmployee } from "@/lib/invite-actions";

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
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="invite-email">Email</label>
        <input id="invite-email" type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="field">
          <label htmlFor="invite-dept">Department</label>
          <select id="invite-dept" value={departmentId} onChange={(e) => setDept(e.target.value)}>
            <option value="">No department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="invite-role">Role</label>
          <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="EMPLOYEE">Employee</option>
            <option value="HR">HR</option>
            <option value="FINANCE">Finance</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-50">
        {pending ? "Sending…" : "Send invite"}
      </button>
      {msg?.ok && <p className="mt-2 text-sm font-medium text-coral">Invite sent.</p>}
      {msg?.error && <p className="mt-2 text-sm font-medium text-coral">{msg.error}</p>}
    </form>
  );
}
