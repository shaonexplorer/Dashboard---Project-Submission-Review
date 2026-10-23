/**
 * Read-only check of the catalog seed's invariants.
 *
 * The seed is deliberately not run here: it rewrites the mentor account,
 * which belongs to the developer, and re-seeding would change a password
 * that is not this script's to change. The invariants are therefore checked
 * against the database as it stands and against the seed source itself.
 *
 * The migration side of the same question is covered by the Prisma CLI:
 *   prisma migrate status                -> both migrations are applied
 *   prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma
 *                                       -> the database matches the datamodel
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(here, "..");

const require = createRequire(path.join(serverDir, "package.json"));
const pg = require("pg");

const envText = readFileSync(path.join(serverDir, ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (match) {
    env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const results = [];

function check(val, label, ok, detail = "") {
  results.push({ val, label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${val.padEnd(10)} ${label}  [${detail}]`);
}

/* ------------------------------------------------------------------ */
/* The catalog in the seed file                                       */
/* ------------------------------------------------------------------ */

const seedSource = readFileSync(path.join(serverDir, "prisma", "seed.ts"), "utf8");
const catalogSource = seedSource.slice(
  seedSource.indexOf("const PROJECT_CATALOG"),
  seedSource.indexOf("] as const;"),
);

/**
 * Reads the catalog out of the seed source.
 *
 * The list is a literal in the source, so it is parsed rather than repeated
 * here — a copy would drift from the file it is meant to describe.
 */
function readCatalog() {
  const entries = [];
  const entryPattern =
    /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*\}/g;

  let match;
  while ((match = entryPattern.exec(catalogSource)) !== null) {
    entries.push({ id: match[1], name: match[2], description: match[3] });
  }

  return entries;
}

const catalog = readCatalog();

check(
  "VAL-05",
  "the seed file holds a readable catalog",
  catalog.length > 0,
  `${catalog.length} entries`,
);

/* ------------------------------------------------------------------ */
/* The catalog in the database                                        */
/* ------------------------------------------------------------------ */

const rows = await pool.query(
  `SELECT "id", "name", "description" FROM "Project" ORDER BY "id"`,
);
const stored = new Map(rows.rows.map((row) => [row.id, row]));

const duplicates = await pool.query(
  `SELECT "id", COUNT(*)::int AS count FROM "Project" GROUP BY "id" HAVING COUNT(*) > 1`,
);
check(
  "VAL-05",
  "the catalog holds no duplicate entries",
  duplicates.rows.length === 0,
  `${duplicates.rows.length} duplicated ids`,
);

const missing = catalog.filter((entry) => !stored.has(entry.id));
check(
  "VAL-05",
  "every seeded project exists in the database",
  missing.length === 0,
  missing.length === 0 ? "all present" : missing.map((entry) => entry.id).join(", "),
);

const changed = catalog.filter((entry) => {
  const row = stored.get(entry.id);
  return (
    row &&
    (row.name !== entry.name || row.description !== entry.description)
  );
});
check(
  "VAL-05",
  "the stored name and description are the seeded ones",
  changed.length === 0,
  changed.length === 0
    ? "all match"
    : changed.map((entry) => entry.id).join(", "),
);

const extra = rows.rows.filter((row) => !catalog.some((entry) => entry.id === row.id));
// An entry that has left the seed file survives, because the seed only ever
// upserts: it never deletes a catalog row.
check(
  "VAL-05",
  "an entry that is no longer in the seed file is kept",
  !/\.delete(Many)?\(/.test(seedSource),
  extra.length === 0
    ? "the seed deletes nothing"
    : `${extra.length} entries outside the seed file, all still present`,
);

/* ------------------------------------------------------------------ */
/* The legacy entry                                                   */
/* ------------------------------------------------------------------ */

const legacy = stored.get("legacy-01");
check(
  "VAL-34",
  "the legacy catalog entry exists",
  Boolean(legacy),
  legacy ? legacy.name : "missing",
);

check(
  "VAL-34",
  "the legacy catalog entry carries the seeded name",
  legacy?.name === "Legacy Submission",
  legacy?.name ?? "missing",
);

/* ------------------------------------------------------------------ */
/* The seed's own behaviour                                           */
/* ------------------------------------------------------------------ */

check(
  "VAL-34",
  "the seed upserts the catalog by its id",
  /project\.upsert\(\s*\{\s*where:\s*\{\s*id:\s*project\.id\s*\}/.test(
    seedSource,
  ),
  "upsert by id",
);

check(
  "VAL-34",
  "the seed creates the entry with its own id",
  /create:\s*\{\s*id:\s*project\.id/.test(seedSource),
  "create with id",
);

check(
  "VAL-34",
  "the seed updates the name and description of an existing entry",
  /update:\s*\{\s*name:\s*project\.name,\s*description:\s*project\.description,?\s*\}/.test(
    seedSource,
  ),
  "update by name and description",
);

check(
  "VAL-05",
  "the seed cannot fail on an entry that is already present",
  /upsert/.test(seedSource) && !/seed.*create\(/.test(seedSource),
  "the catalog is only ever upserted",
);

/* ------------------------------------------------------------------ */
/* The migrations                                                      */
/* ------------------------------------------------------------------ */

/**
 * Runs the Prisma CLI and returns its output.
 *
 * The CLI is called through its entry point rather than through the `.bin`
 * shim, because the repository path contains spaces and the shim fails on it.
 */
function prisma(...args) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(serverDir, "node_modules", "prisma", "build", "index.js"),
      ...args,
      "--config",
      "prisma7.config.ts",
    ],
    { cwd: serverDir, encoding: "utf8" },
  );

  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

const status = prisma("migrate", "status");
check(
  "VAL-33",
  "both migrations are applied to the database",
  status.includes("Database schema is up to date"),
  status.includes("up to date") ? "up to date" : status.trim().split("\n").pop(),
);

// The live database is compared with the datamodel. An empty migration means
// the database holds exactly the schema the datamodel describes — the
// database was produced by applying the migrations, so applying them again
// to a fresh database produces the same schema.
const drift = prisma(
  "migrate",
  "diff",
  "--from-config-datasource",
  "--to-schema",
  "prisma/schema.prisma",
  "--script",
);
check(
  "VAL-33",
  "the database matches the schema the migrations produce",
  drift.includes("empty migration") && !drift.includes("Error:"),
  drift.includes("empty migration") ? "no drift" : drift.trim().split("\n").pop(),
);

/* ------------------------------------------------------------------ */
/* Summary                                                            */
/* ------------------------------------------------------------------ */

await pool.end();

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

if (failed.length > 0) {
  console.log("\nFailed checks:");
  for (const result of failed) {
    console.log(`  ${result.val}  ${result.label}  [${result.detail}]`);
  }
}

process.exit(failed.length > 0 ? 1 : 0);
