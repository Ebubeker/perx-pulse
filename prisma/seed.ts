import { PrismaClient, type OfferCategory } from "@prisma/client";

const prisma = new PrismaClient();

// Seeded catalog providers (no Clerk account — catalog-only, so the AI/marketplace
// is rich from day one). Real self-onboarded providers live alongside these.
// Images are real photos saved under /public/perx/offers (see prisma/seed images).
type SeedOffer = { id: string; title: string; priceLek: number; area: string; taxFree: boolean; img: string; discountPct?: number };
type SeedProvider = {
  slug: string;
  businessName: string;
  category: OfferCategory;
  city: string;
  areas: string[];
  desc: string;
  offers: SeedOffer[];
};

const IMG = (name: string) => `/perx/offers/${name}.jpg`;

const PROVIDERS: SeedProvider[] = [
  // ── Wellness ──────────────────────────────────────────────────────────────
  {
    slug: "nobis-wellness", businessName: "Nobis Wellness", category: "wellness", city: "Tiranë", areas: ["Blloku"],
    desc: "Spa, massage and recovery in the heart of Blloku.",
    offers: [
      { id: "seed_o_nobis_massage", title: "60-min deep-tissue massage", priceLek: 3500, area: "Blloku", taxFree: true, img: "wellness-massage" },
      { id: "seed_o_nobis_sauna", title: "Sauna + relaxation pass", priceLek: 1500, area: "Blloku", taxFree: true, img: "wellness-sauna" },
    ],
  },
  {
    slug: "yoga-tirana", businessName: "Yoga Tirana", category: "wellness", city: "Tiranë", areas: ["Pazari i Ri"],
    desc: "Yoga and breathwork studio by the New Bazaar.",
    offers: [{ id: "seed_o_yoga_pass", title: "5-class yoga pass", priceLek: 2800, area: "Pazari i Ri", taxFree: true, img: "wellness-yoga" }],
  },
  {
    slug: "bao-hammam", businessName: "Bao Spa & Hammam", category: "wellness", city: "Tiranë", areas: ["Blloku"],
    desc: "Traditional hammam rituals and skincare.",
    offers: [{ id: "seed_o_bao_hammam", title: "Hammam ritual for two", priceLek: 4800, area: "Blloku", taxFree: true, img: "wellness-hammam" }],
  },
  {
    slug: "mantra-float", businessName: "Mantra Float Studio", category: "wellness", city: "Tiranë", areas: ["Komuna e Parisit"],
    desc: "Sensory-deprivation float tanks for deep reset.",
    offers: [{ id: "seed_o_mantra_float", title: "60-min float tank session", priceLek: 2600, area: "Komuna e Parisit", taxFree: true, img: "wellness-float" }],
  },

  // ── Fitness ───────────────────────────────────────────────────────────────
  {
    slug: "fitness-zone", businessName: "Fitness Zone", category: "fitness", city: "Tiranë", areas: ["Blloku", "Qendër"],
    desc: "Gym and group classes across Tirana.",
    offers: [
      { id: "seed_o_fz_month", title: "1-month gym membership", priceLek: 4200, area: "Blloku", taxFree: true, img: "fitness-gym" },
      { id: "seed_o_fz_day", title: "Day pass + sauna", priceLek: 1200, area: "Blloku", taxFree: true, img: "fitness-daypass" },
    ],
  },
  {
    slug: "gravity-gym", businessName: "Gravity Gym Tirana", category: "fitness", city: "Tiranë", areas: ["Don Bosko"],
    desc: "Personal training and strength coaching.",
    offers: [{ id: "seed_o_gravity_pt", title: "10 personal-training sessions", priceLek: 9000, area: "Don Bosko", taxFree: true, img: "fitness-pt", discountPct: 10 }],
  },
  {
    slug: "ritmo-crossfit", businessName: "Ritmo CrossFit", category: "fitness", city: "Tiranë", areas: ["Ali Demi"],
    desc: "CrossFit box with daily WODs and coaches.",
    offers: [{ id: "seed_o_ritmo_month", title: "1-month CrossFit unlimited", priceLek: 5500, area: "Ali Demi", taxFree: true, img: "fitness-crossfit" }],
  },
  {
    slug: "pulse-padel", businessName: "Pulse Padel Club", category: "fitness", city: "Tiranë", areas: ["Liqeni i Thatë"],
    desc: "Indoor padel courts by the artificial lake.",
    offers: [{ id: "seed_o_pulse_padel", title: "Padel court + racket rental", priceLek: 1600, area: "Liqeni i Thatë", taxFree: false, img: "fitness-padel" }],
  },

  // ── Food ──────────────────────────────────────────────────────────────────
  {
    slug: "green-bowl", businessName: "Green Bowl", category: "food", city: "Tiranë", areas: ["Rr. Myslym Shyri"],
    desc: "Healthy lunches, bowls and salads.",
    offers: [
      { id: "seed_o_gb_lunch5", title: "5 healthy lunch bowls", priceLek: 3000, area: "Rr. Myslym Shyri", taxFree: false, img: "food-bowls" },
      { id: "seed_o_gb_smoothie", title: "Smoothie + bowl combo", priceLek: 700, area: "Rr. Myslym Shyri", taxFree: false, img: "food-smoothie" },
    ],
  },
  {
    slug: "mulliri-i-vjeter", businessName: "Mulliri i Vjetër", category: "food", city: "Tiranë", areas: ["Komuna e Parisit"],
    desc: "Albania's beloved coffee and bakery chain.",
    offers: [{ id: "seed_o_mulliri_coffee", title: "Coffee + dessert for two", priceLek: 900, area: "Komuna e Parisit", taxFree: false, img: "food-coffee" }],
  },
  {
    slug: "era-restaurant", businessName: "Era Restaurant", category: "food", city: "Tiranë", areas: ["Blloku"],
    desc: "Traditional Albanian & Mediterranean cuisine.",
    offers: [{ id: "seed_o_era_dinner", title: "Traditional dinner for two", priceLek: 3800, area: "Blloku", taxFree: false, img: "food-dinner" }],
  },
  {
    slug: "sophie-caffe", businessName: "Sophie Caffe", category: "food", city: "Tiranë", areas: ["Rr. e Durrësit"],
    desc: "Patisserie and all-day brunch spot.",
    offers: [{ id: "seed_o_sophie_brunch", title: "Weekend brunch for two", priceLek: 2200, area: "Rr. e Durrësit", taxFree: false, img: "food-brunch" }],
  },
  {
    slug: "mrizi-i-zanave", businessName: "Mrizi i Zanave", category: "food", city: "Lezhë", areas: ["Fishtë"],
    desc: "Albania's famous slow-food, farm-to-table agritourism.",
    offers: [{ id: "seed_o_mrizi_tasting", title: "Slow-food tasting menu", priceLek: 4500, area: "Fishtë", taxFree: false, img: "food-tasting" }],
  },

  // ── Health ────────────────────────────────────────────────────────────────
  {
    slug: "salus-clinic", businessName: "Salus Clinic", category: "health", city: "Tiranë", areas: ["Rr. e Kavajës"],
    desc: "Physiotherapy, check-ups and wellbeing.",
    offers: [
      { id: "seed_o_salus_physio", title: "Physiotherapy session", priceLek: 4000, area: "Rr. e Kavajës", taxFree: true, img: "health-physio" },
      { id: "seed_o_salus_checkup", title: "Annual health check-up", priceLek: 5500, area: "Rr. e Kavajës", taxFree: true, img: "health-checkup" },
    ],
  },
  {
    slug: "hygeia-tirana", businessName: "Hygeia Hospital Tirana", category: "health", city: "Tiranë", areas: ["Laprakë"],
    desc: "Full-service private hospital and diagnostics.",
    offers: [{ id: "seed_o_hygeia_panel", title: "Full blood panel + consult", priceLek: 6500, area: "Laprakë", taxFree: true, img: "health-bloodpanel" }],
  },
  {
    slug: "dental-smile", businessName: "Dental Smile Tirana", category: "health", city: "Tiranë", areas: ["Blloku"],
    desc: "Modern dentistry and cosmetic care.",
    offers: [{ id: "seed_o_dental_clean", title: "Dental cleaning + whitening", priceLek: 5000, area: "Blloku", taxFree: true, img: "health-dental", discountPct: 15 }],
  },
  {
    slug: "optivision", businessName: "OptiVision", category: "health", city: "Tiranë", areas: ["Qendër"],
    desc: "Eye exams and designer eyewear.",
    offers: [{ id: "seed_o_opti_exam", title: "Eye exam + glasses voucher", priceLek: 4500, area: "Qendër", taxFree: true, img: "health-optometry" }],
  },

  // ── Travel ────────────────────────────────────────────────────────────────
  {
    slug: "riviera-escapes", businessName: "Riviera Escapes", category: "travel", city: "Vlorë", areas: ["Riviera"],
    desc: "Weekend getaways on the Albanian Riviera.",
    offers: [{ id: "seed_o_riviera_weekend", title: "Weekend night in Dhërmi", priceLek: 6500, area: "Riviera", taxFree: false, img: "travel-riviera" }],
  },
  {
    slug: "berat-heritage", businessName: "Berat Heritage Stays", category: "travel", city: "Berat", areas: ["Mangalem"],
    desc: "Boutique guesthouses in the city of a thousand windows.",
    offers: [{ id: "seed_o_berat_stay", title: "2 nights in old-town Berat", priceLek: 8000, area: "Mangalem", taxFree: false, img: "travel-berat" }],
  },
  {
    slug: "theth-lodge", businessName: "Theth Highland Lodge", category: "travel", city: "Theth", areas: ["Alpet Shqiptare"],
    desc: "Alpine cabins in the Accursed Mountains.",
    offers: [{ id: "seed_o_theth_cabin", title: "Alpine cabin weekend", priceLek: 7000, area: "Alpet Shqiptare", taxFree: false, img: "travel-theth" }],
  },
  {
    slug: "dajti-tower-hotel", businessName: "Dajti Tower Hotel", category: "travel", city: "Tiranë", areas: ["Mali i Dajtit"],
    desc: "Mountaintop hotel and spa above Tirana.",
    offers: [{ id: "seed_o_dajti_spa", title: "Spa weekend on the mountain", priceLek: 9500, area: "Mali i Dajtit", taxFree: false, img: "travel-dajtihotel", discountPct: 10 }],
  },

  // ── Learning ──────────────────────────────────────────────────────────────
  {
    slug: "tirana-academy", businessName: "Tirana Academy", category: "learning", city: "Tiranë", areas: ["Online"],
    desc: "Online courses and micro-learning.",
    offers: [{ id: "seed_o_academy_course", title: "Online course credit", priceLek: 3500, area: "Online", taxFree: true, img: "learning-online" }],
  },
  {
    slug: "protik-ict", businessName: "PROTIK ICT", category: "learning", city: "Tiranë", areas: ["Qendër"],
    desc: "Coding bootcamps and tech workshops.",
    offers: [{ id: "seed_o_protik_bootcamp", title: "Weekend coding bootcamp seat", priceLek: 6000, area: "Qendër", taxFree: true, img: "learning-bootcamp" }],
  },
  {
    slug: "language-loft", businessName: "Albanian Language Loft", category: "learning", city: "Tiranë", areas: ["Online"],
    desc: "Language courses — Albanian, English, Italian.",
    offers: [{ id: "seed_o_loft_pack", title: "8-lesson language pack", priceLek: 4000, area: "Online", taxFree: true, img: "learning-language" }],
  },
  {
    slug: "lincoln-library", businessName: "Lincoln Center Library", category: "learning", city: "Tiranë", areas: ["Qendër"],
    desc: "Reading membership and study spaces.",
    offers: [{ id: "seed_o_lincoln_member", title: "Annual reading membership", priceLek: 2500, area: "Qendër", taxFree: true, img: "learning-library" }],
  },

  // ── Culture ───────────────────────────────────────────────────────────────
  {
    slug: "dajti-ekspres", businessName: "Dajti Ekspres", category: "culture", city: "Tiranë", areas: ["Mali i Dajtit"],
    desc: "Cable car and mountain experiences.",
    offers: [{ id: "seed_o_dajti_cable", title: "Cable car + mountain lunch", priceLek: 1800, area: "Mali i Dajtit", taxFree: false, img: "culture-cablecar" }],
  },
  {
    slug: "bunkart", businessName: "Bunk'Art Tirana", category: "culture", city: "Tiranë", areas: ["Qendër"],
    desc: "History museum inside a Cold-War bunker.",
    offers: [{ id: "seed_o_bunkart_entry", title: "Museum entry for two", priceLek: 1000, area: "Qendër", taxFree: false, img: "culture-museum" }],
  },
  {
    slug: "teatri-kombetar", businessName: "Teatri Kombëtar", category: "culture", city: "Tiranë", areas: ["Qendër"],
    desc: "Albania's National Theatre.",
    offers: [{ id: "seed_o_teatri_night", title: "Theatre night for two", priceLek: 2400, area: "Qendër", taxFree: false, img: "culture-theatre" }],
  },
  {
    slug: "tirana-jazz", businessName: "Tirana Jazz Club", category: "culture", city: "Tiranë", areas: ["Blloku"],
    desc: "Live jazz nights in Blloku.",
    offers: [{ id: "seed_o_jazz_night", title: "Live jazz night + drinks", priceLek: 2000, area: "Blloku", taxFree: false, img: "culture-jazz" }],
  },

  // ── Telecom ───────────────────────────────────────────────────────────────
  {
    slug: "one-albania", businessName: "ONE Albania", category: "telecom", city: "Tiranë", areas: ["Tiranë"],
    desc: "Mobile data and telecom perks.",
    offers: [{ id: "seed_o_one_data", title: "Monthly data top-up", priceLek: 1500, area: "Tiranë", taxFree: false, img: "telecom-data" }],
  },
  {
    slug: "vodafone-al", businessName: "Vodafone Albania", category: "telecom", city: "Tiranë", areas: ["Tiranë"],
    desc: "5G plans and device bundles.",
    offers: [{ id: "seed_o_vodafone_5g", title: "Unlimited 5G monthly bundle", priceLek: 2500, area: "Tiranë", taxFree: false, img: "telecom-5g" }],
  },
  {
    slug: "digicom", businessName: "Digicom Electronics", category: "telecom", city: "Tiranë", areas: ["Rr. e Kavajës"],
    desc: "Phones, audio and smart accessories.",
    offers: [{ id: "seed_o_digicom_earbuds", title: "Wireless earbuds voucher", priceLek: 3500, area: "Rr. e Kavajës", taxFree: false, img: "telecom-earbuds", discountPct: 20 }],
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
      const data = {
        providerId: provider.id,
        title: o.title,
        category: p.category,
        priceLek: o.priceLek,
        discountPct: o.discountPct ?? 0,
        area: o.area,
        taxFree: o.taxFree,
        imageUrl: IMG(o.img),
        active: true,
      };
      await prisma.offer.upsert({
        where: { id: o.id },
        update: data,
        create: { id: o.id, ...data },
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
