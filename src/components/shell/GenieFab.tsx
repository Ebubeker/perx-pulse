"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Employee-only floating Genie button — a circular Perx character. Hidden on the Genie page. */
export function GenieFab({ label }: { label: string }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/dashboard/employee/genie")) return null;
  return (
    <Link
      href="/dashboard/employee/genie"
      aria-label={label}
      className="group fixed bottom-20 right-4 z-30 overflow-hidden rounded-full bg-violet shadow-soft ring-2 ring-paper transition active:scale-95 md:bottom-6"
      style={{ width: "3.5rem", height: "3.5rem" }}
    >
      <Image
        src="/perx/characters/perx-mood-cool.png"
        alt=""
        fill
        sizes="56px"
        unoptimized
        className="scale-[1.6] object-cover transition group-hover:scale-[1.72]"
      />
    </Link>
  );
}
