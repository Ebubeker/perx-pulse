import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { passportFor, ALL_CATEGORIES } from "@/lib/passport";

export const dynamic = "force-dynamic";

const DISC = [
  { bg: "var(--coral)", color: "#fff" },
  { bg: "var(--lime)", color: "var(--ink)" },
  { bg: "var(--ink)", color: "#fff" },
] as const;

export default async function PassportPage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const [collected, perksEnjoyed, claimsCount] = await Promise.all([
    passportFor(m.id),
    prisma.order.count({ where: { employeeProfileId: m.id } }),
    prisma.dropClaim.count({ where: { employeeProfileId: m.id } }),
  ]);
  const have = ALL_CATEGORIES.filter((c) => collected.has(c.key)).length;
  const full = have === ALL_CATEGORIES.length;

  // top category label = the first category in canonical order the employee has collected
  const topCat = ALL_CATEGORIES.find((c) => collected.has(c.key))?.label ?? "—";
  const totalPerks = perksEnjoyed + claimsCount;

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div className="greet"><div className="day">Your year so far</div><h1>Passport</h1></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Mascot mood={full ? "celebrate" : "cool"} size={58} className="float" />
        </div>
      </div>

      <div className="recap">
        <h1>{full ? "Full passport!" : `A great year, ${m.displayName.split(" ")[0]}`}</h1>
        <div className="rg">
          <div className="b"><b>{totalPerks}</b><span>Perks enjoyed</span></div>
          <div className="b"><b>{topCat}</b><span>Top category</span></div>
          <div className="b"><b>{have}/{ALL_CATEGORIES.length}</b><span>Stamps explored</span></div>
          <div className="b"><b>{m.recognitionCoins.toLocaleString("en-US")}</b><span>PerxCoin balance</span></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", background: "var(--lime-soft)", borderColor: "#E3EBBE" }}>
        <span style={{ fontSize: 22 }}><Icon name="store" size={22} /></span>
        <div style={{ fontSize: 14 }}>
          {full ? (
            <><b>You did it:</b> every kind of perk explored. You&apos;re a true Perx explorer.</>
          ) : (
            <>Try a new kind of perk to fill your passport — <b>{ALL_CATEGORIES.length - have} stamp{ALL_CATEGORIES.length - have === 1 ? "" : "s"} left</b> to collect.</>
          )}
        </div>
      </div>

      <div className="sec"><h3>Stamps</h3><span className="link">{have} / {ALL_CATEGORIES.length} collected</span></div>
      <div className="stamp-grid">
        {ALL_CATEGORIES.map((c, i) => {
          const got = collected.has(c.key);
          const disc = DISC[i % DISC.length]!;
          return (
            <Link key={c.key} href={`/dashboard/employee?cat=${c.key}#browse`} className={`stamp ${got ? "got" : "lock"}`}>
              <div className="disc" style={got ? { background: disc.bg, color: disc.color } : undefined}>{got ? <Icon name={c.icon} size={24} /> : <Icon name="lock" size={22} />}</div>
              <div className="nm">{c.label}</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
