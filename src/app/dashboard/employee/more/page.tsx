import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";

export const dynamic = "force-dynamic";

const ITEMS: { href: string; icon: IconName; label: string; sub: string }[] = [
  { href: "/dashboard/recognition", icon: "card", label: "Coins & vouchers", sub: "Balance, codes, kudos & history" },
  { href: "/dashboard/employee/spin", icon: "sparkles", label: "Daily Spin", sub: "Free coins every day" },
  { href: "/dashboard/employee/drops", icon: "bolt", label: "Perx Drops", sub: "Flash deals near you" },
  { href: "/dashboard/leaderboard", icon: "trophy", label: "Leaderboard", sub: "Who's most recognized" },
  { href: "/dashboard/employee/passport", icon: "passport", label: "Passport", sub: "Your awards & year so far" },
  { href: "/dashboard/employee/genie", icon: "genie", label: "Perx Genie", sub: "Ask the AI concierge" },
  { href: "/dashboard/team", icon: "team", label: "Team packs", sub: "Pool perks with coworkers" },
];

export default function MorePage() {
  return (
    <main className="mx-auto max-w-md px-5 py-5 md:max-w-3xl">
      <div className="greet mb-4"><div className="day">Everything else</div><h1>More</h1></div>
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((it) => (
          <Link key={it.href} href={it.href} className="tile flex flex-col gap-2.5">
            <span className="grid size-11 place-items-center rounded-full bg-coral-soft text-coral-deep"><Icon name={it.icon} size={22} /></span>
            <div>
              <div className="font-display font-bold leading-tight">{it.label}</div>
              <div className="text-[12.5px] text-muted">{it.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
