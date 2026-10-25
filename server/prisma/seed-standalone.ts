import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed the system mentor account and the project catalog.
 */
const SEED_EMAIL = "mentor@example.com";
const SEED_NAME = "System Mentor";
const SEED_ROLE = UserRole.MENTOR;
const SEED_PASSWORD = process.env.SEED_MENTOR_PASSWORD ?? "Mentor@Secure123!";

const PROJECT_CATALOG = [
  { id: "legacy-01", name: "Legacy Submission", description: "Project carried over from a previous cohort." },
  { id: "ph-01", name: "Task Orchestrator", description: "Distributed job scheduler with a CLI and a dashboard." },
  { id: "ph-02", name: "Realtime Chat", description: "WebSocket chat with presence, history and typing indicators." },
  { id: "ph-03", name: "Portfolio Builder", description: "Static site generator for a multi-page developer portfolio." },
  { id: "ph-04", name: "Telemetry Gateway", description: "Ingestion endpoint that aggregates and charts device metrics." },
  { id: "ph-05", name: "Expense Tracker", description: "Double-entry bookkeeping app with recurring transactions." },
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

  console.log(`Seeded mentor account: ${user.email} (${user.role}) — id: ${user.id}`);

  for (const project of PROJECT_CATALOG) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: { name: project.name, description: project.description },
      create: { id: project.id, name: project.name, description: project.description, isActive: true },
    });
  }

  console.log(`Seeded project catalog: ${PROJECT_CATALOG.length} project(s)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });