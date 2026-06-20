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
              <Link
                href={item.href}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 ${active ? "text-primary" : "text-muted"}`}
              >
                <span className="relative">
                  <Icon name={item.icon} size={23} />
                  {showBadge && (
                    <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {pendingCount}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium">{labels[item.labelKey] ?? item.key}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
