/**
 * Demo data seed — fills "Acme Tirana" with a believable team + activity so the whole
 * app can be explored by signing into the existing test accounts (no account creation needed).
 * Idempotent: re-running skips if the demo roster already exists.
 *
 * Run: npx tsx prisma/seed-demo.ts
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const code = () => {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = randomBytes(6);
  let s = "";
  for (let i = 0; i < 6; i++) s += A[b[i]! % A.length];
  return `PERX-${s}`;
};
const split = (gross: number, take: number) => {
  const fee = Math.round((gross * take) / 100);
  return { fee, net: gross - fee };
};

const NEW_EMPLOYEES = [
  { slug: "arta-k", name: "Arta Krasniqi", dept: "Design", role: "EMPLOYEE", pref: ["food", "wellness"], home: "Blloku" },
  { slug: "besnik-h", name: "Besnik Hoxha", dept: "Engineering", role: "EMPLOYEE", pref: ["fitness", "telecom"], home: "Don Bosko" },
  { slug: "elira-d", name: "Elira Dervishi", dept: "Sales", role: "EMPLOYEE", pref: ["travel", "food"], home: "Komuna e Parisit" },
  { slug: "genti-b", name: "Genti Berisha", dept: "Engineering", role: "EMPLOYEE", pref: ["learning", "wellness"], home: "Ali Demi" },
  { slug: "klea-s", name: "Klea Shala", dept: "People", role: "HR", pref: ["wellness", "health"], home: "Blloku" },
  { slug: "luan-g", name: "Luan Gjoni", dept: "Sales", role: "EMPLOYEE", pref: ["food", "travel"], home: "Yzberisht" },
  { slug: "mira-k", name: "Mira Kola", dept: "Design", role: "EMPLOYEE", pref: ["wellness", "culture"], home: "Blloku" },
  { slug: "renis-p", name: "Renis Prifti", dept: "Engineering", role: "EMPLOYEE", pref: ["fitness", "learning"], home: "Astir" },
  { slug: "sara-n", name: "Sara Ndoja", dept: "People", role: "EMPLOYEE", pref: ["health", "food"], home: "Qyteti Studenti" },
  { slug: "teuta-l", name: "Teuta Leka", dept: "Sales", role: "EMPLOYEE", pref: ["travel", "wellness"], home: "Kombinat" },
] as const;

async function main() {
  const company = await prisma.company.findFirst({ where: { name: "Acme Tirana sh.p.k." } });
  if (!company) throw new Error("Acme Tirana not found — run the base flow first.");

  const marker = await prisma.employeeProfile.findFirst({ where: { companyId: company.id, displayName: "Arta Krasniqi" } });
  if (marker) {
    console.log("Demo data already seeded — nothing to do.");
    return;
  }

  // 1) Departments
  const deptNames = ["Engineering", "Sales", "People", "Design"];
  const deptByName = new Map<string, string>();
  for (const name of deptNames) {
    const d = await prisma.department.upsert({
      where: { companyId_name: { companyId: company.id, name } },
      update: {},
      create: { companyId: company.id, name },
    });
    deptByName.set(name, d.id);
  }

  // 2) Employees (non-loginable colleagues — placeholder clerk ids)
  const roster: { id: string; name: string; pref: readonly string[] }[] = [];
  for (const e of NEW_EMPLOYEES) {
    const created = await prisma.employeeProfile.create({
      data: {
        clerkUserId: `seed:emp:${e.slug}`,
        companyId: company.id,
        departmentId: deptByName.get(e.dept) ?? null,
        role: e.role as "EMPLOYEE" | "HR",
        displayName: e.name,
        jobTitle: e.dept,
        perksBudgetLek: 12000,
        preferredCategories: [...e.pref],
        interests: [...e.pref],
        wellnessGoals: (e.pref as readonly string[]).includes("wellness") ? ["less stress"] : [],
        homeArea: e.home,
        onboardingComplete: true,
      },
    });
    roster.push({ id: created.id, name: e.name, pref: e.pref });
  }

  // Include the real loginable employees in the social graph
  const realEmps = await prisma.employeeProfile.findMany({
    where: { companyId: company.id, displayName: { in: ["Endrit Berisha", "Drini Mema"] } },
    select: { id: true, displayName: true },
  });
  const everyone = [...roster.map((r) => ({ id: r.id, name: r.name })), ...realEmps.map((r) => ({ id: r.id, name: r.displayName }))];

  // 3) Recognition ledger (kudos this month + a couple of company grants)
  const received = new Map<string, number>();
  const add = (id: string, n: number) => received.set(id, (received.get(id) ?? 0) + n);
  const KUDOS: [number, number, number, string][] = [
    // [giverIdx, receiverIdx, amount, memo] — indexes into `everyone`
    [0, 3, 20, "Carried the redesign across the line 🎨"],
    [1, 4, 15, "Unblocked the whole team on the API"],
    [2, 5, 10, "Closed the Q deal solo 🏆"],
    [3, 0, 10, "Always first to help"],
    [4, 6, 25, "Saved the demo at 2am 🙌"],
    [5, 1, 10, "Patient code review, learned a ton"],
    [6, 7, 15, "Onboarded me like a pro"],
    [7, 2, 20, "Best presentation of the month"],
    [8, 4, 10, "Thanks for the cover on Friday"],
    [9, 0, 15, "Your deck made the difference"],
    [10, 5, 20, "Mentorship that actually sticks"],
    [11, 10, 10, "Team lunch hero"],
  ];
  for (const [gi, ri, amt, memo] of KUDOS) {
    const giver = everyone[gi % everyone.length]!;
    const receiver = everyone[(ri + 1) % everyone.length]!;
    if (giver.id === receiver.id) continue;
    await prisma.coinTxn.create({ data: { companyId: company.id, kind: "KUDOS", fromEmployeeId: giver.id, toEmployeeId: receiver.id, amount: amt, memo } });
    add(receiver.id, amt);
  }
  // Company grants
  for (const [ri, amt, memo] of [[2, 100, "3-year work anniversary 🎉"], [6, 50, "Employee of the month"], [9, 75, "Going above and beyond"]] as [number, number, string][]) {
    const receiver = everyone[ri]!;
    await prisma.coinTxn.create({ data: { companyId: company.id, kind: "GRANT", fromEmployeeId: null, toEmployeeId: receiver.id, amount: amt, memo } });
    add(receiver.id, amt);
  }

  // 4) Pulses with varied moods → insights mood heatmap + participation
  const MOODS = ["Stressful", "Tiring", "Productive", "Social", "Flat", "Productive", "Stressful", "Social"];
  for (let i = 0; i < roster.length && i < MOODS.length; i++) {
    const r = roster[i]!;
    await prisma.pulse.create({
      data: { employeeProfileId: r.id, budgetMode: "SPEND_ALL", answers: { week: MOODS[i]!, need: "Relax", where: "Near work" } },
    });
  }

  // 5) Approved packs + settled orders across categories → heatmap, budgets, passport, provider feeds
  const offers = await prisma.offer.findMany({ where: { active: true }, include: { provider: { select: { id: true, takeRatePct: true, businessName: true } } } });
  const byCat = new Map<string, typeof offers>();
  for (const o of offers) { const a = byCat.get(o.category) ?? []; a.push(o); byCat.set(o.category, a); }
  const pick = (cat: string) => (byCat.get(cat) ?? [])[0];

  const PACK_PLANS: { empIdx: number; label: string; cats: string[] }[] = [
    { empIdx: 0, label: "Foodie Fuel", cats: ["food", "fitness"] },
    { empIdx: 1, label: "Gym & Data", cats: ["fitness", "telecom"] },
    { empIdx: 2, label: "Weekend Away", cats: ["travel", "food"] },
    { empIdx: 3, label: "Learn & Reset", cats: ["learning", "wellness"] },
    { empIdx: 4, label: "Health Check", cats: ["health", "wellness"] },
    { empIdx: 5, label: "Taste of Tirana", cats: ["food", "travel"] },
    { empIdx: 8, label: "Clinic & Greens", cats: ["health", "food"] },
  ];
  for (const plan of PACK_PLANS) {
    const emp = roster[plan.empIdx]!;
    const items = plan.cats.map(pick).filter(Boolean);
    if (!items.length) continue;
    const total = items.reduce((s, o) => s + o!.priceLek, 0);
    const pkg = await prisma.perkPackage.create({
      data: {
        companyId: company.id,
        employeeProfileId: emp.id,
        label: plan.label,
        rationale: "Built from this week's Pulse.",
        itemOfferIds: items.map((o) => o!.id),
        totalLek: total,
        status: "APPROVED",
        decidedByClerkUserId: "seed:admin",
        decidedAt: new Date(),
      },
    });
    for (const o of items) {
      const { fee, net } = split(o!.priceLek, o!.provider.takeRatePct);
      await prisma.order.create({
        data: {
          packageId: pkg.id, companyId: company.id, providerId: o!.provider.id, offerId: o!.id, employeeProfileId: emp.id,
          title: o!.title, grossLek: o!.priceLek, takeRatePct: o!.provider.takeRatePct, feeLek: fee, netLek: net, code: code(),
        },
      });
    }
  }

  // 6) Drops from various providers (some with claims)
  const provBy = new Map(offers.map((o) => [o.provider.businessName, o.provider.id] as const));
  const dropDefs = [
    { prov: "Green Bowl", title: "Flash: free dessert with any bowl", cat: "food", cost: 30, slots: 8, hours: 48 },
    { prov: "Fitness Zone", title: "Flash: 3-day gym trial", cat: "fitness", cost: 40, slots: 10, hours: 72 },
    { prov: "Riviera Escapes", title: "Flash: weekend day-trip seat", cat: "travel", cost: 80, slots: 5, hours: 96 },
    { prov: "ONE Albania", title: "Flash: 10GB data top-up", cat: "telecom", cost: 20, slots: 20, hours: 120 },
  ];
  for (const d of dropDefs) {
    const pid = provBy.get(d.prov);
    if (!pid) continue;
    const drop = await prisma.drop.create({
      data: { providerId: pid, title: d.title, category: d.cat as never, costCoins: d.cost, totalSlots: d.slots, endsAt: new Date(Date.now() + d.hours * 3_600_000) },
    });
    // a couple of claims from well-funded employees
    for (const ri of [6, 9]) {
      const emp = everyone[ri]!;
      if ((received.get(emp.id) ?? 0) >= d.cost) {
        await prisma.dropClaim.create({ data: { dropId: drop.id, employeeProfileId: emp.id, code: code() } });
        await prisma.drop.update({ where: { id: drop.id }, data: { claimedSlots: { increment: 1 } } });
        await prisma.coinTxn.create({ data: { companyId: company.id, kind: "SPEND", fromEmployeeId: emp.id, toEmployeeId: null, amount: d.cost, memo: `Claimed: ${d.title}` } });
        received.set(emp.id, (received.get(emp.id) ?? 0) - d.cost);
      }
    }
  }

  // 7) Team packs
  const teamDefs = [
    { creatorIdx: 1, title: "Saturday hike at Dajti ⛰️", desc: "Cable car up, picnic at the top.", target: 8, memberIdxs: [1, 3, 6, 7, 9] },
    { creatorIdx: 2, title: "Team lunch at Mulliri i Vjetër 🍽️", desc: "Long Friday lunch, on the perks.", target: 6, memberIdxs: [2, 0, 4, 5] },
  ];
  for (const t of teamDefs) {
    const creator = roster[t.creatorIdx]!;
    const pack = await prisma.teamPack.create({
      data: { companyId: company.id, createdByEmployeeId: creator.id, title: t.title, description: t.desc, targetSize: t.target },
    });
    for (const mi of t.memberIdxs) {
      const emp = roster[mi]!;
      await prisma.teamPackMember.upsert({
        where: { teamPackId_employeeProfileId: { teamPackId: pack.id, employeeProfileId: emp.id } },
        update: {},
        create: { teamPackId: pack.id, employeeProfileId: emp.id },
      });
    }
  }

  // 8) Apply coin balances
  for (const [id, delta] of received) {
    if (delta !== 0) await prisma.employeeProfile.update({ where: { id }, data: { recognitionCoins: { increment: delta } } });
  }

  console.log(`Seeded: +${roster.length} employees, ${KUDOS.length} kudos + 3 grants, ${PACK_PLANS.length} approved packs, ${dropDefs.length} drops, ${teamDefs.length} team packs.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
