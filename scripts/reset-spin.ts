/**
 * One-off: let a given account spin the Daily Spin again *today*.
 *
 * The production "already spun today" guard finds a CoinTxn { kind:GRANT,
 * memo:"Daily Spin", createdAt >= start-of-day } for the user's EmployeeProfile.
 * The prod container runs in UTC, so we clear by the UTC day. We delete today's
 * spin grant(s) (incl. any "Daily Spin Streak" bonus) and refund the wallet so
 * the ledger and recognitionCoins balance stay consistent — exactly what the
 * (production-disabled) resetSpinToday helper does.
 *
 *   npx tsx scripts/reset-spin.ts rexhaebubeker@gmail.com
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
    if (m && m[1] === key) {
      return (m[2] ?? "").replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

function utcStartOfDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

async function main() {
  const email = (process.argv[2] || "rexhaebubeker@gmail.com").toLowerCase();

  const databaseUrl = readEnv(".env", "DATABASE_URL");
  const clerkSecret = readEnv(".env.local", "CLERK_SECRET_KEY");
  if (!databaseUrl) throw new Error("DATABASE_URL not found in .env");
  if (!clerkSecret) throw new Error("CLERK_SECRET_KEY not found in .env.local");

  const clerk = createClerkClient({ secretKey: clerkSecret });
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  // 1) email -> clerk user
  const list = await clerk.users.getUserList({ emailAddress: [email] });
  const user = list.data[0];
  if (!user) throw new Error(`No Clerk user for ${email}`);
  console.log(`Clerk user: ${user.id} (${user.firstName ?? ""} ${user.lastName ?? ""})`.trim());

  // 2) all employee profiles for that user (covers whichever membership is active)
  const profiles = await prisma.employeeProfile.findMany({
    where: { clerkUserId: user.id },
    select: { id: true, companyId: true, recognitionCoins: true },
  });
  if (profiles.length === 0) throw new Error(`No EmployeeProfile for clerkUserId ${user.id}`);

  const since = utcStartOfDay();
  console.log(`Clearing "Daily Spin" grants since ${since.toISOString()} (UTC day)\n`);

  for (const p of profiles) {
    const grants = await prisma.coinTxn.findMany({
      where: {
        toEmployeeId: p.id,
        kind: "GRANT",
        memo: { in: ["Daily Spin", "Daily Spin Streak"] },
        createdAt: { gte: since },
      },
      select: { id: true, amount: true, memo: true, createdAt: true },
    });

    if (grants.length === 0) {
      console.log(`profile ${p.id}: no spin today — nothing to reset (balance ${p.recognitionCoins})`);
      continue;
    }

    const refund = grants.reduce((s, g) => s + g.amount, 0);
    for (const g of grants) {
      console.log(`  - delete ${g.memo} ${g.amount}🪙 @ ${g.createdAt.toISOString()}`);
    }

    const [, prof] = await prisma.$transaction([
      prisma.coinTxn.deleteMany({ where: { id: { in: grants.map((g) => g.id) } } }),
      prisma.employeeProfile.update({
        where: { id: p.id },
        data: { recognitionCoins: { decrement: refund } },
        select: { recognitionCoins: true },
      }),
    ]);

    console.log(
      `profile ${p.id}: reset ✓ refunded ${refund}🪙 removed | balance ${p.recognitionCoins} -> ${prof.recognitionCoins}\n`,
    );
  }

  await prisma.$disconnect();
  console.log("Done. You can spin again now.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
