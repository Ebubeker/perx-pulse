/** Backfills offer descriptions so detail pages have readable content. Idempotent (only fills nulls). */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Specific copy for known catalog titles (matched case-insensitively, substring).
const OVERRIDES: [string, string][] = [
  ["deep-tissue massage", "A full 60-minute deep-tissue massage with a trained therapist — targets tension in the back, neck and shoulders. Towels and an aftercare herbal tea are included."],
  ["sauna", "Unlimited sauna access plus a quiet relaxation lounge for your session — the perfect reset after a workout or a stressful week."],
  ["yoga", "Drop-in yoga classes to use whenever you like — all levels welcome, mats and props provided. Breathe, stretch, and unwind."],
  ["gym", "Full access to the gym floor — cardio, free weights and machines — no membership required. Just bring your code."],
  ["lunch", "A fresh, balanced lunch prepared daily — seasonal bowls and salads. Dine in or take away, just show your code at the counter."],
  ["bowl", "A wholesome signature bowl made to order with fresh local produce. Vegetarian and vegan options available."],
  ["yoga pass", "A pack of drop-in yoga classes — flexible timing, all levels, equipment provided."],
  ["checkup", "A professional health check-up with a qualified clinician, including the core screenings and a short consultation."],
  ["dental", "A dental check-up and clean with an experienced dentist — book a slot that suits you."],
  ["day-trip", "A guided day-trip to recharge away from the desk — transport and entry included. Reserve your seat and show your code on arrival."],
  ["escape", "A relaxing getaway package to switch off and recharge — reserve ahead and present your code at check-in."],
  ["course", "Enrol in a hands-on course and learn something new on your employer's budget — materials included."],
  ["data", "A mobile data top-up applied straight to your account once you redeem — stay connected without the bill."],
];

const CATEGORY: Record<string, string> = {
  wellness: "A restorative wellness session to unwind, de-stress and reset. Book a time that suits you and just show up with your redemption code.",
  fitness: "Get moving with full access — bring your code, no membership needed. A great midweek energy boost.",
  food: "A fresh, satisfying meal on the house — dine in or take away, just present your code at the counter.",
  health: "A professional health service to keep you at your best — schedule your visit and redeem with your code.",
  travel: "A getaway to recharge away from the desk — reserve your spot and show your code on arrival.",
  learning: "Level up with a class or course — learn something new on your employer's budget, redeem with your code.",
  culture: "A cultural experience to enjoy on your time off — present your code at the door.",
  telecom: "A connectivity top-up to keep you online — applied to your account once you redeem the code.",
};

async function main() {
  const offers = await prisma.offer.findMany({ where: { description: null } });
  let n = 0;
  for (const o of offers) {
    const t = o.title.toLowerCase();
    const hit = OVERRIDES.find(([k]) => t.includes(k));
    const description = hit ? hit[1] : (CATEGORY[o.category] ?? "Redeem with your code at the provider — fully employer-funded and tax-free where applicable.");
    await prisma.offer.update({ where: { id: o.id }, data: { description } });
    n++;
  }
  console.log(`Backfilled ${n} offer descriptions.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
