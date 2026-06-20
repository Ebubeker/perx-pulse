/**
 * Coin-economy backfill (idempotent):
 *  - sets each employee's unified PerxCoin wallet = monthly allowance (120) + coins received from recognition
 *  - applies demo discounts to a few offers so the discount UI is visible
 * Run: npx tsx prisma/seed-coins.ts
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const ALLOWANCE_COINS = 120; // 12,000 Lek / 100

const DISCOUNTS: [string, number][] = [
  ["5-class yoga pass", 20],
  ["Day pass + sauna", 15],
  ["healthy lunch", 25],
  ["deep-tissue massage", 10],
  ["data top-up", 30],
];

async function main() {
  // 1) discounts (match by title substring, case-insensitive)
  const offers = await prisma.offer.findMany();
  let d = 0;
  for (const o of offers) {
    const hit = DISCOUNTS.find(([k]) => o.title.toLowerCase().includes(k));
    const pct = hit ? hit[1] : 0;
    if (o.discountPct !== pct) { await prisma.offer.update({ where: { id: o.id }, data: { discountPct: pct } }); d++; }
  }

  // 2) unified wallet = allowance + lifetime recognition received (idempotent recompute)
  const employees = await prisma.employeeProfile.findMany({ select: { id: true } });
  for (const e of employees) {
    const got = await prisma.coinTxn.aggregate({
      where: { toEmployeeId: e.id, kind: { in: ["KUDOS", "GRANT"] } },
      _sum: { amount: true },
    });
    await prisma.employeeProfile.update({
      where: { id: e.id },
      data: { recognitionCoins: ALLOWANCE_COINS + (got._sum.amount ?? 0) },
    });
  }

  console.log(`Set discounts on ${d} offers; topped up ${employees.length} wallets (allowance ${ALLOWANCE_COINS} + earned).`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
