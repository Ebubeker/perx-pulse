/**
 * Inspect provider accounts on the live DB so we can hand over a loginable one.
 *   npx tsx scripts/inspect-providers.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createClerkClient } from "@clerk/backend";

function readEnv(file: string, key: string): string | undefined {
  let raw: string;
  try {
    raw = readFileSync(join(process.cwd(), file), "utf8");
  } catch {
    return undefined;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] === key) return (m[2] ?? "").replace(/^["']|["']$/g, "");
  }
  return undefined;
}

async function main() {
  const databaseUrl = readEnv(".env", "DATABASE_URL")!;
  const clerkSecret = readEnv(".env.local", "CLERK_SECRET_KEY")!;
  const clerk = createClerkClient({ secretKey: clerkSecret });
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  // The known test provider login
  const list = await clerk.users.getUserList({ emailAddress: ["provider.test+clerk_test@gmail.com"] });
  const u = list.data[0];
  console.log("=== Clerk provider.test+clerk_test@gmail.com ===");
  if (u) {
    console.log(`id=${u.id} meta=${JSON.stringify(u.publicMetadata)} pwEnabled=${u.passwordEnabled}`);
  } else {
    console.log("NOT FOUND");
  }

  console.log("\n=== All Provider rows ===");
  const providers = await prisma.provider.findMany({
    select: { id: true, businessName: true, slug: true, clerkUserId: true, onboardingComplete: true },
    orderBy: { createdAt: "asc" },
  });
  for (const p of providers) {
    const offers = await prisma.offer.count({ where: { providerId: p.id } });
    const orders = await prisma.order.count({ where: { providerId: p.id } });
    const loginable = p.clerkUserId.startsWith("user_");
    console.log(
      `${loginable ? "👤" : "  "} ${p.businessName.padEnd(22)} offers=${offers} orders=${orders} onboarded=${p.onboardingComplete} clerk=${p.clerkUserId}`,
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
