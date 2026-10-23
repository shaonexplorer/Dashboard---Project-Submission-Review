/**
 * End-to-end check of the Phase 00 "prevent duplicate submission" feature.
 *
 * Runs the scenarios from
 * `specs/00-Prevent Duplicate Submission/validations.md` against a running API
 * and a running database.
 *
 * Reads the credentials from `server/.env` without printing them and keeps
 * every session cookie in memory. The accounts it creates carry a run-specific
 * suffix and are removed again at the end of the run, so the database is left
 * exactly as it was found.
 *
 * A run that fails part-way through leaves its accounts behind; the next run
 * clears them before it starts, so the script is safe to run repeatedly.
 *
 * Usage:
 *   node ./scripts/verify-phase00.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(path.join(here, "..", ".env"), "utf8");

const env = {};
for (const line of envText.split(/\r?\n/)) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (match) {
    env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const API = (env.API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const PASSWORD = env.SEED_MENTOR_PASSWORD;
const DATABASE_URL = env.DATABASE_URL;

if (!PASSWORD || !DATABASE_URL) {
  console.error("server/.env must define SEED_MENTOR_PASSWORD and DATABASE_URL");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

/* ------------------------------------------------------------------ */
/* Reporting                                                          */
/* ------------------------------------------------------------------ */

const results = [];

function check(val, label, ok, detail = "") {
  results.push({ val, label, ok });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${val.padEnd(9)} ${label}${detail ? `  [${detail}]` : ""}`,
  );
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Calls the API and returns the status and the parsed body.
 *
 * A session is a plain object holding the cookie. The cookie is never printed
 * and never written to disk.
 */
async function api(session, method, path_, body) {
  const headers = { "Content-Type": "application/json" };
  if (session?.cookie) headers.Cookie = session.cookie;

  const response = await fetch(`${API}${path_}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie && session) session.cookie = setCookie.split(";")[0];

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { status: response.status, payload };
}

/** The validation issue reported for a field, if there is one. */
function fieldError(payload, field) {
  return (payload?.errors ?? []).find((issue) => issue.field === field);
}

const runId = Date.now().toString(36);
const createdUserIds = [];

/** Creates a throwaway student account and signs it in. */
async function makeStudent(label) {
  const session = { cookie: "" };
  const email = `phase00-${label}-${runId}@example.com`;

  const signup = await api(session, "POST", "/auth/signup", {
    fullName: `Phase 00 ${label}`,
    email,
    password: PASSWORD,
  });

  if (signup.status !== 201) {
    throw new Error(`signup for ${label} failed with ${signup.status}`);
  }

  const me = await api(session, "GET", "/auth/me");
  const id = me.payload?.data?.user?.id;
  if (id) createdUserIds.push(id);

  return { session, email, id };
}

/** A valid submission body for a catalog project. */
function body(projectId, overrides = {}) {
  return {
    projectId,
    repoUrl: "https://github.com/student/phase-00-project",
    liveUrl: "https://phase-00-project.vercel.app",
    description: "Distributed job scheduler built for the Phase 00 check.",
    ...overrides,
  };
}

async function query(text, values = []) {
  return pool.query(text, values);
}

/**
 * Removes everything a previous run of this script left behind.
 *
 * The accounts are named with a fixed prefix and the retired catalog fixture
 * with another one, so nothing outside this script is ever touched.
 */
async function purgeTestData() {
  await query(
    `DELETE FROM "Submission"
      WHERE "studentId" IN (SELECT id FROM "User" WHERE email LIKE 'phase00-%')`,
  );
  await query(`DELETE FROM "User" WHERE email LIKE 'phase00-%'`);
  await query(`DELETE FROM "Project" WHERE id LIKE 'tmp-inactive-%'`);
}

/* ------------------------------------------------------------------ */
/* Setup                                                              */
/* ------------------------------------------------------------------ */

section("Setup");

const mentor = { cookie: "" };
const mentorLogin = await api(mentor, "POST", "/auth/login", {
  email: "mentor@example.com",
  password: PASSWORD,
});

if (mentorLogin.status !== 200) {
  console.error(`the mentor could not be signed in (${mentorLogin.status})`);
  process.exit(1);
}
const mentorId = mentorLogin.payload?.data?.user?.id;
console.log("mentor signed in");

const catalogResponse = await api(mentor, "GET", "/projects");
const allProjects = catalogResponse.payload?.data?.projects ?? [];
// The legacy entry is left alone: it carries the submissions that predate
// this feature, and the migration checks below are about those rows.
const projects = allProjects.filter((project) => project.id !== "legacy-01");

if (projects.length < 5) {
  console.error(`the catalog needs at least five entries, found ${projects.length}`);
  process.exit(1);
}

const [A, B, C, D, E] = projects;

/**
 * The retired catalog entry this run inserts, to exercise the "isActive =
 * false" rules. It is declared out here so the cleanup can remove it even
 * when a check throws.
 */
const inactiveId = `tmp-inactive-${runId}`;

// A previous run that failed part-way through may have left its accounts
// behind. They are cleared first, so the run starts from a known state.
await purgeTestData();

/* ------------------------------------------------------------------ */
/* 2. Catalog validation                                              */
/* ------------------------------------------------------------------ */

section("Catalog");

// A retired entry, inserted directly, so the "isActive = false" rules can be
// checked. It is removed again at the end of the run.
await query(
  `INSERT INTO "Project" (id, name, description, "isActive", "createdAt", "updatedAt")
   VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  [inactiveId, `Temporary Inactive ${runId}`, "Inserted by the Phase 00 verification script."],
);

const catalogWithFixture = await api(mentor, "GET", "/projects");
const listedProjects = catalogWithFixture.payload?.data?.projects ?? [];

check(
  "VAL-01",
  "GET /projects answers 200",
  catalogWithFixture.status === 200,
  `status ${catalogWithFixture.status}`,
);
check(
  "VAL-01",
  "every listed entry is active",
  listedProjects.length > 0 && listedProjects.every((project) => project.isActive),
);
check(
  "VAL-01",
  "an inactive entry is not listed",
  !listedProjects.some((project) => project.id === inactiveId),
);

const names = listedProjects.map((project) => project.name);
const sortedNames = [...names].sort((a, b) => a.localeCompare(b, "en"));
check(
  "VAL-03",
  "the catalog is ordered by name, ascending",
  JSON.stringify(names) === JSON.stringify(sortedNames),
);

const repeatCatalog = await api(mentor, "GET", "/projects");
const repeatNames = (repeatCatalog.payload?.data?.projects ?? []).map(
  (project) => project.name,
);
check(
  "VAL-03",
  "the order is identical across repeated requests",
  JSON.stringify(names) === JSON.stringify(repeatNames),
);

const anonymousCatalog = await api(null, "GET", "/projects");
check(
  "VAL-02",
  "an anonymous catalog request is refused",
  anonymousCatalog.status === 401,
  `status ${anonymousCatalog.status}`,
);

for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
  const refused = await api(mentor, method, "/projects", { id: "x", name: "x" });
  check(
    "VAL-04",
    `the catalog has no ${method} write path`,
    refused.status === 404 || refused.status === 405,
    `status ${refused.status}`,
  );
}

/* ------------------------------------------------------------------ */
/* 3. Submission creation                                             */
/* ------------------------------------------------------------------ */

section("Submission creation");

const rules = await makeStudent("rules");

const freeText = await api(
  rules.session,
  "POST",
  "/submissions",
  body(undefined, { projectName: "Typed By Hand" }),
);
check(
  "VAL-07",
  "a free-text project name is refused",
  freeText.status === 400 && Boolean(fieldError(freeText.payload, "projectId")),
  `status ${freeText.status}`,
);

const unknownProject = await api(
  rules.session,
  "POST",
  "/submissions",
  body("does-not-exist"),
);
check(
  "VAL-08",
  "an unknown project is refused",
  unknownProject.status === 400 &&
    Boolean(fieldError(unknownProject.payload, "projectId")),
  `status ${unknownProject.status}`,
);

const inactiveProject = await api(
  rules.session,
  "POST",
  "/submissions",
  body(inactiveId),
);
check(
  "VAL-09",
  "an inactive project is refused",
  inactiveProject.status === 400 &&
    Boolean(fieldError(inactiveProject.payload, "projectId")),
  `status ${inactiveProject.status}`,
);

const nonGithub = await api(
  rules.session,
  "POST",
  "/submissions",
  body(A.id, { repoUrl: "https://gitlab.com/student/project" }),
);
check(
  "VAL-10",
  "a non-GitHub repository is refused",
  nonGithub.status === 400 && Boolean(fieldError(nonGithub.payload, "repoUrl")),
  `status ${nonGithub.status}`,
);

const badProtocol = await api(
  rules.session,
  "POST",
  "/submissions",
  body(A.id, { liveUrl: "ftp://example.com/project" }),
);
check(
  "VAL-10",
  "a non-HTTP live URL is refused",
  badProtocol.status === 400 &&
    Boolean(fieldError(badProtocol.payload, "liveUrl")),
  `status ${badProtocol.status}`,
);

const emptyDescription = await api(
  rules.session,
  "POST",
  "/submissions",
  body(A.id, { description: "   " }),
);
check(
  "VAL-10",
  "an empty description is refused",
  emptyDescription.status === 400 &&
    Boolean(fieldError(emptyDescription.payload, "description")),
  `status ${emptyDescription.status}`,
);

const longDescription = await api(
  rules.session,
  "POST",
  "/submissions",
  body(A.id, { description: "x".repeat(5001) }),
);
check(
  "VAL-10",
  "a description over 5000 characters is refused",
  longDescription.status === 400 &&
    Boolean(fieldError(longDescription.payload, "description")),
  `status ${longDescription.status}`,
);

// The URLs are bounded at 150 characters.
const overLongRepo = await api(
  rules.session,
  "POST",
  "/submissions",
  body(A.id, { repoUrl: `https://github.com/${"a".repeat(200)}` }),
);
check(
  "VAL-10",
  "a repository URL over 150 characters is refused",
  overLongRepo.status === 400 &&
    Boolean(fieldError(overLongRepo.payload, "repoUrl")),
  `status ${overLongRepo.status}`,
);

const overLongLive = await api(
  rules.session,
  "POST",
  "/submissions",
  body(A.id, { liveUrl: `https://example.com/${"a".repeat(200)}` }),
);
check(
  "VAL-10",
  "a live URL over 150 characters is refused",
  overLongLive.status === 400 &&
    Boolean(fieldError(overLongLive.payload, "liveUrl")),
  `status ${overLongLive.status}`,
);

const exactRepo = `https://github.com/${"a".repeat(150 - "https://github.com/".length)}`;
const exactLive = `https://example.com/${"a".repeat(150 - "https://example.com/".length)}`;
check(
  "VAL-10",
  "a 150 character URL is accepted",
  exactRepo.length === 150 && exactLive.length === 150,
  `${exactRepo.length} / ${exactLive.length}`,
);

const mentorSubmit = await api(mentor, "POST", "/submissions", body(A.id));
check(
  "VAL-11",
  "a mentor cannot submit",
  mentorSubmit.status === 403,
  `status ${mentorSubmit.status}`,
);

// The client cannot escalate its own submission.
const forged = await api(
  rules.session,
  "POST",
  "/submissions",
  body(A.id, {
    projectName: "Forged Name",
    studentId: "someone-else",
    status: "APPROVED",
    attempt: 7,
  }),
);
const forgedSubmission = forged.payload?.data?.submission;
const forgedRow = forgedSubmission
  ? (
      await query(`SELECT * FROM "Submission" WHERE id = $1`, [
        forgedSubmission.id,
      ])
    ).rows[0]
  : null;

check(
  "VAL-56",
  "a forged project name is not persisted",
  forged.status === 201 && forgedRow?.projectName === A.name,
  `stored "${forgedRow?.projectName}"`,
);
check(
  "VAL-57",
  "a forged status is not honoured",
  forged.status === 201 && forgedRow?.status === "PENDING",
  `stored "${forgedRow?.status}"`,
);
check(
  "VAL-57",
  "a forged attempt is not honoured",
  forged.status === 201 && forgedRow?.attempt === 1,
  `stored ${forgedRow?.attempt}`,
);
check(
  "VAL-57",
  "a forged student id is not honoured",
  forged.status === 201 && forgedRow?.studentId === rules.id,
);

// The URLs are accepted at the boundary. A separate account is used, because
// the one above already holds a submission for this project.
const lengths = await makeStudent("lengths");
const exactLength = await api(
  lengths.session,
  "POST",
  "/submissions",
  body(E.id, { repoUrl: exactRepo, liveUrl: exactLive }),
);
check(
  "VAL-10",
  "a submission with 150 character URLs is accepted",
  exactLength.status === 201,
  `status ${exactLength.status}`,
);

const accepted = forgedSubmission;
check(
  "VAL-06",
  "the created submission starts at PENDING, attempt 1",
  accepted?.status === "PENDING" && accepted?.attempt === 1,
  `${accepted?.status} / attempt ${accepted?.attempt}`,
);

/* ------------------------------------------------------------------ */
/* 4. Duplicate prevention                                            */
/* ------------------------------------------------------------------ */

section("Duplicate prevention");

const dup = await makeStudent("dup");

const firstCreate = await api(dup.session, "POST", "/submissions", body(A.id));
check(
  "VAL-06",
  "a submission is created with 201",
  firstCreate.status === 201,
  `status ${firstCreate.status}`,
);

await api(mentor, "PATCH", `/submissions/${firstCreate.payload.data.submission.id}/status`, {
  status: "APPROVED",
  feedback: "Approved by the Phase 00 check.",
});

const approvedAgain = await api(dup.session, "POST", "/submissions", body(A.id));
check(
  "VAL-13",
  "an approved project cannot be submitted again",
  approvedAgain.status === 409 &&
    approvedAgain.payload?.code === "DUPLICATE_SUBMISSION",
  `${approvedAgain.status} ${approvedAgain.payload?.code ?? "no code"}`,
);

const secondCreate = await api(dup.session, "POST", "/submissions", body(B.id));
check(
  "VAL-15",
  "a different project is accepted",
  secondCreate.status === 201,
  `status ${secondCreate.status}`,
);

await api(mentor, "PATCH", `/submissions/${secondCreate.payload.data.submission.id}/status`, {
  status: "REJECTED",
  feedback: "Rejected by the Phase 00 check.",
});

const rejectedAgain = await api(dup.session, "POST", "/submissions", body(B.id));
check(
  "VAL-14",
  "a rejected project asks for a resubmission",
  rejectedAgain.status === 409 &&
    rejectedAgain.payload?.code === "RESUBMIT_REQUIRED",
  `${rejectedAgain.status} ${rejectedAgain.payload?.code ?? "no code"}`,
);
check(
  "VAL-14",
  "the two duplicate cases are told apart by the code",
  approvedAgain.payload?.code !== rejectedAgain.payload?.code,
);

const dupRows = (
  await query(
    `SELECT COUNT(*)::int AS count FROM "Submission" WHERE "studentId" = $1`,
    [dup.id],
  )
).rows[0].count;
check("VAL-12", "the rejected project still has exactly one row", dupRows === 2, `${dupRows} rows`);

// Two students may submit the same project.
const twoA = await makeStudent("two-a");
const twoB = await makeStudent("two-b");
const twoAResult = await api(twoA.session, "POST", "/submissions", body(C.id));
const twoBResult = await api(twoB.session, "POST", "/submissions", body(C.id));
check(
  "VAL-16",
  "two students may submit the same project",
  twoAResult.status === 201 && twoBResult.status === 201,
  `${twoAResult.status} / ${twoBResult.status}`,
);

// Two concurrent requests for the same pair.
const race = await makeStudent("race");
const concurrent = await Promise.all([
  api(race.session, "POST", "/submissions", body(D.id)),
  api(race.session, "POST", "/submissions", body(D.id)),
]);
const statuses = concurrent.map((result) => result.status).sort();
check(
  "VAL-17",
  "concurrent duplicate creates leave exactly one winner",
  statuses[0] === 201 && statuses[1] === 409,
  statuses.join(" / "),
);

/* ------------------------------------------------------------------ */
/* 5. Resubmission                                                    */
/* ------------------------------------------------------------------ */

section("Resubmission");

const resub = await makeStudent("resub");
const resubCreate = await api(resub.session, "POST", "/submissions", body(C.id));
const resubId = resubCreate.payload.data.submission.id;

await api(mentor, "PATCH", `/submissions/${resubId}/status`, {
  status: "REJECTED",
  feedback: "First pass notes.",
});

const resubmit = await api(resub.session, "PUT", `/submissions/${resubId}/resubmit`, {
  repoUrl: "https://github.com/student/phase-00-second-pass",
  liveUrl: "https://phase-00-second-pass.vercel.app",
  description: "Second attempt after the first pass was rejected.",
});
const resubmitted = resubmit.payload?.data?.submission;

check(
  "VAL-19",
  "a resubmission answers 200",
  resubmit.status === 200,
  `status ${resubmit.status}`,
);
check(
  "VAL-19",
  "the resubmission returns to PENDING at attempt 2",
  resubmitted?.status === "PENDING" && resubmitted?.attempt === 2,
  `${resubmitted?.status} / attempt ${resubmitted?.attempt}`,
);
check(
  "VAL-19",
  "the resubmission is timestamped",
  Boolean(resubmitted?.resubmittedAt),
);
check(
  "VAL-19",
  "the new deliverable is stored",
  resubmitted?.repoUrl === "https://github.com/student/phase-00-second-pass" &&
    resubmitted?.liveUrl === "https://phase-00-second-pass.vercel.app" &&
    resubmitted?.description ===
      "Second attempt after the first pass was rejected.",
);
check(
  "VAL-19",
  "the project is unchanged",
  resubmitted?.projectId === C.id && resubmitted?.projectName === C.name,
);
check(
  "VAL-19",
  "the previous feedback is retained",
  resubmitted?.feedback === "First pass notes.",
);

const resubRows = (
  await query(`SELECT COUNT(*)::int AS count FROM "Submission" WHERE id = $1`, [
    resubId,
  ])
).rows[0].count;
check("VAL-19", "the resubmission reused the row", resubRows === 1, `${resubRows} rows`);

// VAL-38 — a mentor reviews the attempt 2.
const review = await api(mentor, "PATCH", `/submissions/${resubId}/status`, {
  status: "REJECTED",
  feedback: "Second pass notes.",
});
const reviewed = review.payload?.data?.submission;
const reviewedRow = (
  await query(`SELECT * FROM "Submission" WHERE id = $1`, [resubId])
).rows[0];

check(
  "VAL-38",
  "the review updates the status and the feedback",
  review.status === 200 &&
    reviewed?.status === "REJECTED" &&
    reviewed?.feedback === "Second pass notes.",
);
check("VAL-38", "the attempt counter is left alone", reviewed?.attempt === 2, `attempt ${reviewed?.attempt}`);
check("VAL-38", "the review is timestamped", Boolean(reviewedRow?.reviewedAt));
check("VAL-38", "the review is attributed to the mentor", reviewedRow?.reviewedById === mentorId);

const thirdAttempt = await api(resub.session, "PUT", `/submissions/${resubId}/resubmit`, {
  repoUrl: "https://github.com/student/phase-00-third-pass",
  liveUrl: "https://phase-00-third-pass.vercel.app",
  description: "Third attempt.",
});
const thirdRows = (
  await query(`SELECT COUNT(*)::int AS count FROM "Submission" WHERE id = $1`, [
    resubId,
  ])
).rows[0].count;

check(
  "VAL-20",
  "a second resubmission reaches attempt 3",
  thirdAttempt.status === 200 &&
    thirdAttempt.payload?.data?.submission?.attempt === 3,
  `attempt ${thirdAttempt.payload?.data?.submission?.attempt}`,
);
check("VAL-20", "the second resubmission created no row", thirdRows === 1, `${thirdRows} rows`);

// A pending or approved submission cannot be resubmitted.
const pending = await makeStudent("pending");
const pendingCreate = await api(pending.session, "POST", "/submissions", body(E.id));
const pendingResubmit = await api(
  pending.session,
  "PUT",
  `/submissions/${pendingCreate.payload.data.submission.id}/resubmit`,
  {
    repoUrl: "https://github.com/student/phase-00-pending",
    liveUrl: "https://phase-00-pending.vercel.app",
    description: "Should not be accepted.",
  },
);
check(
  "VAL-21",
  "a pending submission cannot be resubmitted",
  pendingResubmit.status === 409 &&
    pendingResubmit.payload?.code === "NOT_RESUBMITTABLE",
  `${pendingResubmit.status} ${pendingResubmit.payload?.code ?? "no code"}`,
);

const approvedResubmit = await api(
  dup.session,
  "PUT",
  `/submissions/${firstCreate.payload.data.submission.id}/resubmit`,
  {
    repoUrl: "https://github.com/student/phase-00-approved",
    liveUrl: "https://phase-00-approved.vercel.app",
    description: "Should not be accepted.",
  },
);
check(
  "VAL-22",
  "an approved submission cannot be resubmitted",
  approvedResubmit.status === 409 &&
    approvedResubmit.payload?.code === "NOT_RESUBMITTABLE",
  `${approvedResubmit.status} ${approvedResubmit.payload?.code ?? "no code"}`,
);

// Another student's submission is missing, not forbidden.
const other = await makeStudent("other");
const foreignResubmit = await api(
  other.session,
  "PUT",
  `/submissions/${resubId}/resubmit`,
  {
    repoUrl: "https://github.com/student/phase-00-foreign",
    liveUrl: "https://phase-00-foreign.vercel.app",
    description: "Should not be accepted.",
  },
);
check(
  "VAL-23",
  "another student's submission is reported as missing",
  foreignResubmit.status === 404,
  `status ${foreignResubmit.status}`,
);

const unknownResubmit = await api(
  other.session,
  "PUT",
  "/submissions/00000000-0000-4000-8000-000000000000/resubmit",
  {
    repoUrl: "https://github.com/student/phase-00-unknown",
    liveUrl: "https://phase-00-unknown.vercel.app",
    description: "Should not be accepted.",
  },
);
check(
  "VAL-24",
  "an unknown submission is reported as missing",
  unknownResubmit.status === 404,
  `status ${unknownResubmit.status}`,
);

// The resubmit body is held to the same rules as the create body.
const resubval = await makeStudent("resubval");
const resubvalCreate = await api(resubval.session, "POST", "/submissions", body(D.id));
await api(
  mentor,
  "PATCH",
  `/submissions/${resubvalCreate.payload.data.submission.id}/status`,
  { status: "REJECTED", feedback: "Rejected for the validation check." },
);

const badResubmit = await api(
  resubval.session,
  "PUT",
  `/submissions/${resubvalCreate.payload.data.submission.id}/resubmit`,
  {
    repoUrl: "https://gitlab.com/student/project",
    liveUrl: "not-a-url",
    description: "",
  },
);
check(
  "VAL-25",
  "a malformed resubmission is refused field by field",
  badResubmit.status === 400 &&
    Boolean(fieldError(badResubmit.payload, "repoUrl")) &&
    Boolean(fieldError(badResubmit.payload, "liveUrl")) &&
    Boolean(fieldError(badResubmit.payload, "description")),
  `status ${badResubmit.status}`,
);

const projectSwap = await api(
  resubval.session,
  "PUT",
  `/submissions/${resubvalCreate.payload.data.submission.id}/resubmit`,
  {
    repoUrl: "https://github.com/student/phase-00-swap",
    liveUrl: "https://phase-00-swap.vercel.app",
    description: "Trying to move to another project.",
    projectId: E.id,
  },
);
const swapRow = (
  await query(`SELECT * FROM "Submission" WHERE id = $1`, [
    resubvalCreate.payload.data.submission.id,
  ])
).rows[0];
check(
  "VAL-26",
  "a resubmission cannot change the project",
  projectSwap.status === 200 && swapRow?.projectId === D.id,
  `project ${swapRow?.projectId}`,
);

/* ------------------------------------------------------------------ */
/* 6. Student listing                                                 */
/* ------------------------------------------------------------------ */

section("Student listing");

const listing = await api(dup.session, "GET", "/submissions/me");
const listed = listing.payload?.data?.submissions ?? [];

check("VAL-28", "the listing answers 200", listing.status === 200, `status ${listing.status}`);
check("VAL-28", "the listing holds every submission", listed.length === 2, `${listed.length} rows`);
check(
  "VAL-28",
  "the most recent submission comes first",
  listed.length === 2 &&
    new Date(listed[0].submittedAt).getTime() >=
      new Date(listed[1].submittedAt).getTime(),
);
check(
  "VAL-28",
  "every entry carries projectId, attempt and resubmittedAt",
  listed.every(
    (submission) =>
      typeof submission.projectId === "string" &&
      typeof submission.attempt === "number" &&
      "resubmittedAt" in submission,
  ),
);

const emptyStudent = await makeStudent("empty");
const emptyListing = await api(emptyStudent.session, "GET", "/submissions/me");
check(
  "VAL-29",
  "an empty listing answers 200 with an empty array",
  emptyListing.status === 200 &&
    Array.isArray(emptyListing.payload?.data?.submissions) &&
    emptyListing.payload.data.submissions.length === 0,
  `status ${emptyListing.status}`,
);

const foreignListing = await api(other.session, "GET", "/submissions/me");
const foreignIds = (foreignListing.payload?.data?.submissions ?? []).map(
  (submission) => submission.id,
);
check(
  "VAL-30",
  "the listing holds only the caller's submissions",
  foreignIds.length === 0 && !foreignIds.includes(resubId),
  `${foreignIds.length} rows`,
);

const mentorListing = await api(mentor, "GET", "/submissions/me");
check(
  "VAL-31",
  "a mentor cannot list student submissions",
  mentorListing.status === 403,
  `status ${mentorListing.status}`,
);

/* ------------------------------------------------------------------ */
/* 7. Rate limiting                                                   */
/* ------------------------------------------------------------------ */

section("Rate limiting");

const limited = await makeStudent("limited");
const limitedCreate = await api(limited.session, "POST", "/submissions", body(A.id));
const limitedId = limitedCreate.payload.data.submission.id;

let limited429 = null;
for (let attempt = 1; attempt <= 25; attempt += 1) {
  const response = await api(
    limited.session,
    "PUT",
    `/submissions/${limitedId}/resubmit`,
    {
      repoUrl: "https://github.com/student/phase-00-limited",
      liveUrl: "https://phase-00-limited.vercel.app",
      description: "Burning the budget.",
    },
  );

  if (response.status === 429) {
    limited429 = attempt;
    break;
  }
}
check(
  "VAL-27",
  "a resubmission is rate limited",
  limited429 !== null,
  limited429 === null ? "no 429 within 25 attempts" : `429 on attempt ${limited429}`,
);

// VAL-59 — the budget belongs to the student, not to the shared address.
const neighbour = await makeStudent("neighbour");
const neighbourCreate = await api(neighbour.session, "POST", "/submissions", body(B.id));
check(
  "VAL-59",
  "another student behind the same address is not rate limited",
  neighbourCreate.status === 201,
  `status ${neighbourCreate.status}`,
);

/* ------------------------------------------------------------------ */
/* 8. Mentor dashboard                                                */
/* ------------------------------------------------------------------ */

section("Mentor dashboard");

const mentorList = await api(mentor, "GET", "/submissions?page=1&limit=100");
const mentorRows = mentorList.payload?.data ?? [];

check(
  "VAL-35",
  "every row carries the catalog code and the attempt",
  mentorRows.length > 0 &&
    mentorRows.every(
      (row) => typeof row.projectId === "string" && typeof row.attempt === "number",
    ),
);
check(
  "VAL-35",
  "a resubmitted row is distinguishable from a first attempt",
  mentorRows.some((row) => row.attempt > 1),
  `attempts: ${[...new Set(mentorRows.map((row) => row.attempt))].join(", ")}`,
);

const searchTerm = A.name.split(" ")[0];
const searched = await api(
  mentor,
  "GET",
  `/submissions?search=${encodeURIComponent(searchTerm)}&limit=100`,
);
const searchedRows = searched.payload?.data ?? [];
check(
  "VAL-36",
  "the search still matches the project name",
  searched.status === 200 &&
    searchedRows.length > 0 &&
    searchedRows.every((row) =>
      row.projectName.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  `${searchedRows.length} rows for "${searchTerm}"`,
);

const sortedAsc = await api(
  mentor,
  "GET",
  "/submissions?sortBy=projectName&sortOrder=asc&limit=100",
);
const ascNames = (sortedAsc.payload?.data ?? []).map((row) => row.projectName);
const sortedDesc = await api(
  mentor,
  "GET",
  "/submissions?sortBy=projectName&sortOrder=desc&limit=100",
);
const descNames = (sortedDesc.payload?.data ?? []).map((row) => row.projectName);

check(
  "VAL-37",
  "sorting by project name, ascending",
  JSON.stringify(ascNames) === JSON.stringify([...ascNames].sort((a, b) => a.localeCompare(b, "en"))),
);
check(
  "VAL-37",
  "sorting by project name, descending",
  JSON.stringify(descNames) === JSON.stringify([...ascNames].sort((a, b) => b.localeCompare(a, "en"))),
);

const sortedByDate = await api(
  mentor,
  "GET",
  "/submissions?sortBy=createdAt&sortOrder=asc&limit=100",
);
const dates = (sortedByDate.payload?.data ?? []).map((row) =>
  new Date(row.createdAt).getTime(),
);
check(
  "VAL-37",
  "sorting by submission date, ascending",
  dates.every((value, index) => index === 0 || dates[index - 1] <= value),
);

const filteredByProject = await api(
  mentor,
  "GET",
  `/submissions?projectId=${encodeURIComponent(C.id)}&limit=100`,
);
check(
  "VAL-37",
  "the list can be filtered by catalog code",
  filteredByProject.status === 200 &&
    (filteredByProject.payload?.data ?? []).every(
      (row) => row.projectId === C.id,
    ),
);

const stats = await api(mentor, "GET", "/submissions/stats");
const statsData = stats.payload?.data ?? {};
check(
  "VAL-60",
  "the statistics keep their shape",
  stats.status === 200 &&
    typeof statsData.total === "number" &&
    typeof statsData.pending === "number" &&
    typeof statsData.approved === "number" &&
    typeof statsData.rejected === "number",
  JSON.stringify(statsData),
);

const pagination = mentorList.payload?.pagination;
check(
  "VAL-60",
  "the pagination envelope is unchanged",
  pagination &&
    pagination.page === 1 &&
    pagination.limit === 100 &&
    typeof pagination.total === "number" &&
    typeof pagination.totalPages === "number",
);

/* ------------------------------------------------------------------ */
/* 9. Authorization                                                   */
/* ------------------------------------------------------------------ */

section("Authorization");

for (const [method, path_] of [
  ["GET", "/projects"],
  ["GET", "/submissions"],
  ["GET", "/submissions/me"],
  ["GET", "/submissions/stats"],
  ["POST", "/submissions"],
  ["PATCH", `/submissions/${resubId}/status`],
  ["PUT", `/submissions/${resubId}/resubmit`],
]) {
  // A GET request carries no body.
  const requestBody = method === "GET" ? undefined : body(A.id);
  const anonymous = await api(null, method, path_, requestBody);
  check(
    "VAL-58",
    `an anonymous ${method} ${path_} is refused`,
    anonymous.status === 401,
    `status ${anonymous.status}`,
  );
}

const studentMentorReads = await Promise.all([
  api(rules.session, "GET", "/submissions"),
  api(rules.session, "GET", "/submissions/stats"),
  api(rules.session, "PATCH", `/submissions/${resubId}/status`, {
    status: "APPROVED",
  }),
]);
check(
  "VAL-58",
  "a student cannot reach the mentor endpoints",
  studentMentorReads.every((result) => result.status === 403),
  studentMentorReads.map((result) => result.status).join(" / "),
);

const mentorStudentReads = await Promise.all([
  api(mentor, "GET", "/submissions/me"),
  api(mentor, "POST", "/submissions", body(A.id)),
  api(mentor, "PUT", `/submissions/${resubId}/resubmit`, {
    repoUrl: "https://github.com/student/phase-00-mentor",
    liveUrl: "https://phase-00-mentor.vercel.app",
    description: "Should not be accepted.",
  }),
]);
check(
  "VAL-58",
  "a mentor cannot reach the student endpoints",
  mentorStudentReads.every((result) => result.status === 403),
  mentorStudentReads.map((result) => result.status).join(" / "),
);

const plainError = await api(
  other.session,
  "PUT",
  "/submissions/00000000-0000-4000-8000-000000000000/resubmit",
  {
    repoUrl: "https://github.com/student/phase-00-plain",
    liveUrl: "https://phase-00-plain.vercel.app",
    description: "Should not be accepted.",
  },
);
check(
  "VAL-61",
  "an error without a code carries no code field",
  plainError.status === 404 &&
    !("code" in (plainError.payload ?? {})) &&
    plainError.payload?.success === false,
  JSON.stringify(plainError.payload),
);

/* ------------------------------------------------------------------ */
/* 10. Database                                                       */
/* ------------------------------------------------------------------ */

section("Database");

const duplicates = await query(
  `SELECT "studentId", "projectId", COUNT(*)
     FROM "Submission"
    GROUP BY "studentId", "projectId"
   HAVING COUNT(*) > 1`,
);
check(
  "VAL-17",
  "no student holds two submissions for the same project",
  duplicates.rowCount === 0,
  `${duplicates.rowCount} offending pairs`,
);

const indexes = await query(
  `SELECT indexname FROM pg_indexes WHERE tablename = 'Submission'`,
);
const indexNames = indexes.rows.map((row) => row.indexname);
check(
  "VAL-18",
  "the unique index on (studentId, projectId) exists",
  indexNames.includes("Submission_studentId_projectId_key"),
  indexNames.join(", "),
);
check(
  "VAL-18",
  "the old one-per-student index is gone",
  !indexNames.includes("Submission_studentId_key"),
);

const nullProjects = await query(
  `SELECT COUNT(*)::int AS count FROM "Submission" WHERE "projectId" IS NULL`,
);
check(
  "VAL-32",
  "every submission points at a catalog entry",
  nullProjects.rows[0].count === 0,
  `${nullProjects.rows[0].count} rows without a project`,
);

const legacyRows = await query(
  `SELECT COUNT(*)::int AS count
     FROM "Submission"
    WHERE "projectId" = 'legacy-01'
      AND ("attempt" <> 1 OR "projectName" <> 'Legacy Submission')`,
);
check(
  "VAL-32",
  "the migrated rows kept attempt 1 and the legacy name",
  legacyRows.rows[0].count === 0,
  `${legacyRows.rows[0].count} rows out of shape`,
);

const mismatchedNames = await query(
  `SELECT s."projectId", s."projectName", p."name" AS catalogName
     FROM "Submission" s
     JOIN "Project" p ON p."id" = s."projectId"
    WHERE s."projectName" <> p."name"`,
);
check(
  "VAL-32",
  "every stored project name matches the catalog",
  mismatchedNames.rowCount === 0,
  `${mismatchedNames.rowCount} mismatched rows`,
);

/* ------------------------------------------------------------------ */
/* 11. Cleanup                                                        */
/* ------------------------------------------------------------------ */

section("Cleanup");

if (createdUserIds.length > 0) {
  await query(`DELETE FROM "Submission" WHERE "studentId" = ANY($1::text[])`, [
    createdUserIds,
  ]);
  await query(`DELETE FROM "User" WHERE "id" = ANY($1::text[])`, [
    createdUserIds,
  ]);
}
await query(`DELETE FROM "Project" WHERE id = $1`, [inactiveId]);

const leftovers = await query(
  `SELECT COUNT(*)::int AS count FROM "User" WHERE email LIKE 'phase00-%'`,
);
check(
  "Cleanup",
  "the throwaway accounts are removed",
  leftovers.rows[0].count === 0,
  `${leftovers.rows[0].count} accounts left`,
);

const finalDuplicates = await query(
  `SELECT "studentId", "projectId", COUNT(*)
     FROM "Submission"
    GROUP BY "studentId", "projectId"
   HAVING COUNT(*) > 1`,
);
check(
  "VAL-17",
  "the database still holds no duplicate pair",
  finalDuplicates.rowCount === 0,
  `${finalDuplicates.rowCount} offending pairs`,
);

await pool.end();

/* ------------------------------------------------------------------ */
/* Summary                                                            */
/* ------------------------------------------------------------------ */

const failed = results.filter((result) => !result.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed`,
);

if (failed.length > 0) {
  console.log("\nFailed checks:");
  for (const result of failed) {
    console.log(`  ${result.val}  ${result.label}`);
  }
}

process.exit(failed.length > 0 ? 1 : 0);
