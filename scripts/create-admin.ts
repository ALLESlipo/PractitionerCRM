// Create (or promote) a platform admin.
//   npm run admin:create -- admin@example.com "Admin Name"
// The password is read from ADMIN_PASSWORD or prompted for.
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const [email, fullName] = process.argv.slice(2);
if (!email || !fullName) {
  console.error('Usage: npm run admin:create -- <email> "<full name>"');
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question("Password (min 12 chars): ");
    rl.close();
  }
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");

  const data = { fullName, role: "admin" as const, verified: true, passwordHash: await hash(password) };
  const admin = await db.practitioner.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), ...data },
    update: data,
  });
  console.log(`Admin ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
