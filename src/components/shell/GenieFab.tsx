"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Employee-only floating Genie button — the Perx character itself, no chrome. Hidden on the Genie page. */
export function GenieFab({ label }: { label: string }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/dashboard/employee/genie")) return null;
  return (
    <Link
      href="/dashboard/employee/genie"
      aria-label={label}
      className="fixed bottom-20 right-4 z-30 drop-shadow-[0_6px_14px_rgba(0,0,0,0.18)] transition hover:scale-105 active:scale-95 md:bottom-6"
    >
      <Image
        src="/perx/characters/perx-mood-cool.png"
        alt=""
        width={80}
        height={80}
        unoptimized
        className="h-20 w-20"
      />
    </Link>
  );
}
