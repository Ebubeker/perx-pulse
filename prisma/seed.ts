import { PrismaClient, type OfferCategory } from "@prisma/client";

const prisma = new PrismaClient();

// Seeded catalog providers (no Clerk account — catalog-only, so the AI/marketplace
// is rich from day one). Real self-onboarded providers live alongside these.
type SeedProvider = {
  slug: string;
  businessName: string;
  category: OfferCategory;
  city: string;
  areas: string[];
  desc: string;
  offers: { id: string; title: string; priceLek: number; area: string; taxFree: boolean }[];
};

const PROVIDERS: SeedProvider[] = [
  {
    slug: "nobis-wellness", businessName: "Nobis Wellness", category: "wellness", city: "Tiranë", areas: ["Blloku"],
    desc: "Spa, massage and recovery in Blloku.",
    offers: [
      { id: "seed_o_nobis_massage", title: "60-min deep-tissue massage", priceLek: 3500, area: "Blloku", taxFree: true },
      { id: "seed_o_nobis_sauna", title: "Sauna + relaxation pass", priceLek: 1500, area: "Blloku", taxFree: true },
    ],
  },
  {
    slug: "fitness-zone", businessName: "Fitness Zone", category: "fitness", city: "Tiranë", areas: ["Blloku", "Qendër"],
    desc: "Gym and group classes across Tirana.",
    offers: [
      { id: "seed_o_fz_month", title: "1-month gym membership", priceLek: 4200, area: "Blloku", taxFree: true },
      { id: "seed_o_fz_day", title: "Day pass + sauna", priceLek: 1200, area: "Blloku", taxFree: true },
    ],
  },
  {
    slug: "green-bowl", businessName: "Green Bowl", category: "food", city: "Tiranë", areas: ["Rr. Myslym Shyri"],
    desc: "Healthy lunches and salads.",
    offers: [
      { id: "seed_o_gb_lunch5", title: "5 healthy lunches", priceLek: 3000, area: "Rr. Myslym Shyri", taxFree: false },
      { id: "seed_o_gb_smoothie", title: "Smoothie + bowl combo", priceLek: 700, area: "Rr. Myslym Shyri", taxFree: false },
    ],
  },
  {
    slug: "salus-clinic", businessName: "Salus Clinic", category: "health", city: "Tiranë", areas: ["Rr. e Kavajës"],
    desc: "Physiotherapy, check-ups and wellbeing.",
    offers: [
      { id: "seed_o_salus_physio", title: "Physiotherapy session", priceLek: 4000, area: "Rr. e Kavajës", taxFree: true },
      { id: "seed_o_salus_checkup", title: "Annual health check-up", priceLek: 5500, area: "Rr. e Kavajës", taxFree: true },
    ],
  },
  {
    slug: "yoga-tirana", businessName: "Yoga Tirana", category: "wellness", city: "Tiranë", areas: ["Pazari i Ri"],
    desc: "Yoga and breathwork studio.",
    offers: [{ id: "seed_o_yoga_pass", title: "5-class yoga pass", priceLek: 2800, area: "Pazari i Ri", taxFree: true }],
  },
  {
    slug: "mulliri-i-vjeter", businessName: "Mulliri i Vjetër", category: "food", city: "Tiranë", areas: ["Komuna e Parisit"],
    desc: "Coffee and bakery, all over Tirana.",
    offers: [{ id: "seed_o_mulliri_coffee", title: "Coffee + dessert for two", priceLek: 900, area: "Komuna e Parisit", taxFree: false }],
  },
  {
    slug: "dajti-ekspres", businessName: "Dajti Ekspres", category: "culture", city: "Tiranë", areas: ["Mali i Dajtit"],
    desc: "Cable car and mountain experiences.",
    offers: [{ id: "seed_o_dajti_cable", title: "Cable car + mountain lunch", priceLek: 1800, area: "Mali i Dajtit", taxFree: false }],
  },
  {
    slug: "tirana-academy", businessName: "Tirana Academy", category: "learning", city: "Tiranë", areas: ["Online"],
    desc: "Online courses and micro-learning.",
    offers: [{ id: "seed_o_academy_course", title: "Online course credit", priceLek: 3500, area: "Online", taxFree: true }],
  },
  {
    slug: "riviera-escapes", businessName: "Riviera Escapes", category: "travel", city: "Vlorë", areas: ["Riviera"],
    desc: "Weekend getaways on the Albanian Riviera.",
    offers: [{ id: "seed_o_riviera_weekend", title: "Weekend night in Dhërmi", priceLek: 6500, area: "Riviera", taxFree: false }],
  },
  {
    slug: "one-albania", businessName: "ONE Albania", category: "telecom", city: "Tiranë", areas: ["Tiranë"],
    desc: "Mobile data and telecom perks.",
    offers: [{ id: "seed_o_one_data", title: "Monthly data top-up", priceLek: 1500, area: "Tiranë", taxFree: false }],
  },
];

async function main() {
  for (const p of PROVIDERS) {
    const provider = await prisma.provider.upsert({
      where: { clerkUserId: `seed:${p.slug}` },
      update: { businessName: p.businessName, category: p.category, city: p.city, areasServed: p.areas, description: p.desc, onboardingComplete: true },
      create: {
        clerkUserId: `seed:${p.slug}`,
        slug: `seed-${p.slug}`,
        businessName: p.businessName,
        category: p.category,
        city: p.city,
        areasServed: p.areas,
        description: p.desc,
        onboardingComplete: true,
      },
    });
    for (const o of p.offers) {
      await prisma.offer.upsert({
        where: { id: o.id },
        update: { providerId: provider.id, title: o.title, category: p.category, priceLek: o.priceLek, area: o.area, taxFree: o.taxFree, active: true },
        create: { id: o.id, providerId: provider.id, title: o.title, category: p.category, priceLek: o.priceLek, area: o.area, taxFree: o.taxFree, active: true },
      });
    }
  }
  const [providers, offers] = await Promise.all([prisma.provider.count(), prisma.offer.count()]);
  console.log(`Seeded catalog. providers=${providers} offers=${offers}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
