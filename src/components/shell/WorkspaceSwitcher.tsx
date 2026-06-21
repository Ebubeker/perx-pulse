"use client";

import { useState, useTransition } from "react";
import { switchWorkspace } from "@/lib/workspace-actions";
import type { Workspace } from "@/lib/account";
import { Icon } from "./icons";

const LABEL: Record<Workspace, string> = {
  company: "Employer",
  employee: "My benefits",
  provider: "Provider",
};

/** Lets a multi-hat user (e.g. a company that is also a provider) flip workspaces. */
export function WorkspaceSwitcher({ workspaces, active, align = "right" }: { workspaces: Workspace[]; active: Workspace; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (workspaces.length < 2) return null;

  function go(ws: Workspace) {
    setOpen(false);
    if (ws === active) return;
    startTransition(() => { void switchWorkspace(ws); });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] font-semibold text-ink hover:bg-cream disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid size-5 place-items-center rounded-full bg-coral-soft text-coral-deep">
          <Icon name={active === "provider" ? "store" : active === "employee" ? "home" : "building"} size={13} />
        </span>
        {LABEL[active]}
        <Icon name="chevronDown" size={14} className="text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute z-50 mt-1.5 min-w-44 rounded-2xl border border-line bg-paper p-1.5 shadow-soft ${align === "left" ? "left-0" : "right-0"}`} role="menu">
            <div className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Switch workspace</div>
            {workspaces.map((ws) => (
              <button
                key={ws}
                type="button"
                role="menuitemradio"
                aria-checked={ws === active}
                onClick={() => go(ws)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium hover:bg-cream ${ws === active ? "text-coral" : "text-ink"}`}
              >
                <span className="grid size-7 place-items-center rounded-full bg-coral-soft text-coral-deep">
                  <Icon name={ws === "provider" ? "store" : ws === "employee" ? "home" : "building"} size={15} />
                </span>
                <span className="grow">{LABEL[ws]}</span>
                {ws === active && <Icon name="check" size={15} className="text-coral" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
