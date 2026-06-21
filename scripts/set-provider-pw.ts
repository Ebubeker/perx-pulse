/**
 * Set a known password on the test provider login so it's guaranteed to work.
 *   npx tsx scripts/set-provider-pw.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
  const clerkSecret = readEnv(".env.local", "CLERK_SECRET_KEY")!;
  const clerk = createClerkClient({ secretKey: clerkSecret });

  const email = "provider.test+clerk_test@gmail.com";
  const password = "PerxDemo!2026xyz";

  const list = await clerk.users.getUserList({ emailAddress: [email] });
  const u = list.data[0];
  if (!u) throw new Error(`No Clerk user for ${email}`);

  await clerk.users.updateUser(u.id, { password, skipPasswordChecks: true });
  console.log(`Password set for ${email} (${u.id}) -> ${password}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
