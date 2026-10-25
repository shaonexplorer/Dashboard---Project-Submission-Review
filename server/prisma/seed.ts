import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "../src/config/prisma";

/**
 * Seed the system mentor account and the project catalog.
 *
 * There is no public mentor registration, so this script is the only way a
 * MENTOR account is created. It is idempotent: running it again updates the
 * existing account (name, role, password hash) instead of duplicating it.
 *
 * Invoked with:  npx prisma db seed   (from the server directory)
 */

const SEED_EMAIL = "mentor@example.com";
const SEED_NAME = "System Mentor";
const SEED_ROLE = UserRole.MENTOR;

// Password for the seeded mentor account. Override with the
// SEED_MENTOR_PASSWORD environment variable — never commit a real value.
const SEED_PASSWORD = process.env.SEED_MENTOR_PASSWORD ?? "Mentor@Secure123!";

/**
 * The catalog of assignable projects.
 *
 * This is a typed, human-editable list. `id` is the stable catalog code shown
 * to students and mentors — it is never a generated UUID, because a readable
 * code is what makes the catalog and the API payloads self-describing.
 *
 * The list ships with placeholder entries. Replace them with the real
 * curriculum before the feature is demonstrated; the catalog *shape* does not
 * depend on how many entries there are.
 */
const PROJECT_CATALOG = [
  {
    id: "legacy-01",
    name: "Legacy Submission",
    description: "Project carried over from a previous cohort.",
  },
  {
    id: "ph-01",
    name: "Task Orchestrator",
    description: "Distributed job scheduler with a CLI and a dashboard.",
  },
  {
    id: "ph-02",
    name: "Realtime Chat",
    description: "WebSocket chat with presence, history and typing indicators.",
  },
  {
    id: "ph-03",
    name: "Portfolio Builder",
    description: "Static site generator for a multi-page developer portfolio.",
  },
  {
    id: "ph-04",
    name: "Telemetry Gateway",
    description: "Ingestion endpoint that aggregates and charts device metrics.",
  },
  {
    id: "ph-05",
    name: "Expense Tracker",
    description: "Double-entry bookkeeping app with recurring transactions.",
  },
] as const;

async function main(): Promise<void> {
  const email = SEED_EMAIL.trim().toLowerCase();
  const passwordHash = await hash(SEED_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: SEED_NAME,
      role: SEED_ROLE,
      passwordHash,
    },
    create: {
      name: SEED_NAME,
      email,
      passwordHash,
      role: SEED_ROLE,
    },
  });

  console.log(
    `Seeded mentor account: ${user.email} (${user.role}) — id: ${user.id}`,
  );

  // The catalog is upserted by its id, never deleted. Re-running the seed
  // therefore updates the name and description of an entry that already
  // exists and inserts the entries that are new — while an entry that has
  // left the seed file stays in the database, because submissions may still
  // reference it.
  for (const project of PROJECT_CATALOG) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        name: project.name,
        description: project.description,
      },
      create: {
        id: project.id,
        name: project.name,
        description: project.description,
        isActive: true,
      },
    });
  }

  console.log(
    `Seeded project catalog: ${PROJECT_CATALOG.length} project(s) — ${PROJECT_CATALOG.map(
      (project) => project.id,
    ).join(", ")}`,
  );
}

let seedPromise: Promise<void> | null = null;

/**
 * Runs the seed at most once per process.
 *
 * The file can be reached two ways — imported by another script, or executed
 * directly by `prisma db seed` — and both may fire. The promise is memoized
 * so the two paths share one run instead of racing two sets of upserts
 * against the same rows.
 */
const runSeed = (): Promise<void> => {
  seedPromise ??= main();
  return seedPromise;
};

runSeed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

export default main;

// Run directly when executed with `tsx prisma/seed.ts`.
if (import.meta.main) {
  void runSeed().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
