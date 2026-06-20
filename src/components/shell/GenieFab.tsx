"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

/** Employee-only floating Genie button — keeps the bottom bar at 4 tabs. Hidden on the Genie page. */
export function GenieFab({ label }: { label: string }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/dashboard/employee/genie")) return null;
  return (
    <Link
      href="/dashboard/employee/genie"
      aria-label={label}
      className="fixed bottom-20 right-4 z-30 flex size-13 items-center justify-center rounded-full bg-violet text-white shadow-soft md:bottom-6"
      style={{ width: "3.25rem", height: "3.25rem" }}
    >
      <Icon name="genie" size={24} />
    </Link>
  );
}
