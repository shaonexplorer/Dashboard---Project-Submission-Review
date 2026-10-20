import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "../src/config/prisma";

/**
 * Seed the system mentor account.
 *
 * There is no public mentor registration, so this script is the only way a
 * MENTOR account is created. It is idempotent: running it again updates the
 * existing account (name, role, password hash) instead of duplicating it.
 *
 * Invoked with:  npx prisma db seed   (from the server directory)
 */

const SEED_EMAIL = "mentor@example.com";
const SEED_FULL_NAME = "System Mentor";
const SEED_ROLE = UserRole.MENTOR;

// Password for the seeded mentor account. Override with the
// SEED_MENTOR_PASSWORD environment variable — never commit a real value.
const SEED_PASSWORD = process.env.SEED_MENTOR_PASSWORD ?? "Mentor@Secure123!";

async function main(): Promise<void> {
  const email = SEED_EMAIL.trim().toLowerCase();
  const passwordHash = await hash(SEED_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: SEED_FULL_NAME,
      role: SEED_ROLE,
      passwordHash,
    },
    create: {
      fullName: SEED_FULL_NAME,
      email,
      passwordHash,
      role: SEED_ROLE,
    },
  });

  console.log(
    `Seeded mentor account: ${user.email} (${user.role}) — id: ${user.id}`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

export default main;

// Run directly when executed with `tsx prisma/seed.ts`.
if (import.meta.main) {
  void main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
