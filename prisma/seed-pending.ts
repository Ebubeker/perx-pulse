/** Adds a couple of PENDING packs so the admin Approvals → settlement flow is testable immediately. Idempotent. */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ where: { name: "Acme Tirana sh.p.k." } });
  if (!company) throw new Error("Acme not found");

  const existing = await prisma.perkPackage.findFirst({ where: { companyId: company.id, status: "PENDING" } });
  if (existing) { console.log("A pending pack already exists — skipping."); return; }

  const offers = await prisma.offer.findMany({ where: { active: true }, include: { provider: { select: { businessName: true } } } });
  const byCat = (c: string) => offers.find((o) => o.category === c);

  const plans = [
    { name: "Mira Kola", label: "Spa & Smoothie", cats: ["wellness", "food"] },
    { name: "Teuta Leka", label: "Coast Escape", cats: ["travel", "wellness"] },
  ];
  for (const p of plans) {
    const emp = await prisma.employeeProfile.findFirst({ where: { companyId: company.id, displayName: p.name } });
    if (!emp) continue;
    const items = p.cats.map(byCat).filter(Boolean);
    if (!items.length) continue;
    await prisma.perkPackage.create({
      data: {
        companyId: company.id, employeeProfileId: emp.id, label: p.label,
        rationale: "Picked from this week's Pulse — ready for your approval.",
        itemOfferIds: items.map((o) => o!.id), totalLek: items.reduce((s, o) => s + o!.priceLek, 0), status: "PENDING",
      },
    });
  }
  console.log("Seeded pending packs for the approvals queue.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
