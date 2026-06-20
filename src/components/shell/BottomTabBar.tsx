"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";
import { NAV_PRIMARY, isActive, ROLE_HOME, type Role } from "./nav-config";

export function BottomTabBar({ role, labels, pendingCount }: { role: Role; labels: Record<string, string>; pendingCount: number }) {
  const pathname = usePathname() ?? ROLE_HOME[role];
  const items = NAV_PRIMARY[role];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          const showBadge = item.badge === "approvals" && pendingCount > 0;
          return (
            <li key={item.key}>
              <Link href={item.href} className="flex min-h-14 flex-col items-center justify-center gap-1 pt-1">
                <span className={`relative grid size-[30px] place-items-center rounded-[12px] transition-colors ${active ? "bg-coral text-white" : "text-muted"}`}>
                  <Icon name={item.icon} size={21} />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1 min-w-4 rounded-full bg-coral px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-paper">
                      {pendingCount}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-semibold ${active ? "text-coral" : "text-muted"}`}>{labels[item.labelKey] ?? item.key}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
