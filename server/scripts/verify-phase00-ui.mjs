/**
 * Renders the student dashboard in a headless browser and checks the
 * interface scenarios from
 * `specs/00-Prevent Duplicate Submission/validations.md`.
 *
 * The API is exercised first, so the dashboard is shown a set of states that
 * are tedious to reach by hand: a first attempt, a retained review from a
 * previous attempt, and a review of the attempt that is on screen.
 *
 * Chrome is driven over the DevTools Protocol, because no browser automation
 * tool is installed here. The script needs the API on port 5000 and the
 * Next.js dev server on port 3000.
 *
 * Reads the credentials from `server/.env` without printing them and removes
 * the accounts it creates when it is done.
 *
 * Usage:
 *   node ./scripts/verify-phase00-ui.mjs
 */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
const WEB = (env.WEB_URL || "http://localhost:3000").replace(/\/$/, "");
const PASSWORD = env.SEED_MENTOR_PASSWORD;
const DATABASE_URL = env.DATABASE_URL;
const CHROME_PATH =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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
/* API helpers                                                        */
/* ------------------------------------------------------------------ */

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

const runId = Date.now().toString(36);
const createdUserIds = [];

async function makeStudent(label) {
  const session = { cookie: "" };
  const email = `phase00-ui-${label}-${runId}@example.com`;

  const signup = await api(session, "POST", "/auth/signup", {
    fullName: `Phase 00 UI ${label}`,
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

function body(projectId) {
  return {
    projectId,
    repoUrl: "https://github.com/student/phase-00-ui",
    liveUrl: "https://phase-00-ui.vercel.app",
    description: "A deliverable handed in for the Phase 00 interface check.",
  };
}

const query = (text, values = []) => pool.query(text, values);

/* ------------------------------------------------------------------ */
/* Chrome over the DevTools Protocol                                  */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const debugPort = 9300 + Math.floor(Math.random() * 400);
const userDataDir = mkdtempSync(path.join(tmpdir(), "phase00-ui-"));

const chrome = spawn(
  CHROME_PATH,
  [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1440,1600",
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function debuggerUrl() {
  const deadline = Date.now() + 20000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://localhost:${debugPort}/json/version`);
      const body = await response.json();
      if (body.webSocketDebuggerUrl) return body.webSocketDebuggerUrl;
    } catch {
      // Chrome is not listening yet.
    }
    await sleep(200);
  }

  throw new Error("Chrome did not open its debugging port");
}

const socket = new WebSocket(await debuggerUrl());
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let messageId = 0;
const pending = new Map();
const loadWaiters = [];
/** Requests held open by the request interception, released afterwards. */
const heldRequests = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);

  if (message.method === "Page.loadEventFired") {
    loadWaiters.splice(0).forEach((resolve) => resolve());
    return;
  }

  if (message.method === "Fetch.requestPaused") {
    // The request is held open, so the catalog stays in its loading state.
    heldRequests.push(message.params.requestId);
    return;
  }

  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
});

function send(method, params = {}, sessionId) {
  const id = ++messageId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(
      JSON.stringify({
        id,
        method,
        params,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
  });
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", {
  targetId,
  flatten: true,
});

await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);

/** Evaluates an expression in the page and returns its value. */
async function evaluate(expression) {
  const result = await send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  );

  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ??
        result.exceptionDetails.text ??
        "the evaluation failed",
    );
  }

  return result.result.value;
}

/** Waits until a page-side condition holds. */
async function waitFor(expression, label, timeout = 20000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const ok = await evaluate(
      `(() => { try { return Boolean(${expression}); } catch { return false; } })()`,
    );
    if (ok) return;
    await sleep(150);
  }

  throw new Error(`timed out waiting for ${label}`);
}

/** Loads a page and waits for the load event. */
async function navigate(url) {
  const loaded = new Promise((resolve) => loadWaiters.push(resolve));
  await send("Page.navigate", { url }, sessionId);
  await Promise.race([loaded, sleep(20000)]);
}

/** Loads a page and waits until it has rendered its main area. */
async function open(url) {
  await navigate(url);
  await waitFor(
    'document.readyState === "complete" && document.querySelector("main")',
    url,
  );
}

/**
 * Signs a student in from inside the page.
 *
 * The session cookie is httpOnly, so it can only be set by the API response —
 * the login is therefore performed by the page itself, with the credential
 * included. The token is written to the local storage the client reads, which
 * means the browser has to be on the web origin first.
 */
async function signIn(email) {
  await open(`${WEB}/`);

  const status = await evaluate(
    `(async () => {
      const response = await fetch(${JSON.stringify(`${API}/auth/login`)}, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: ${JSON.stringify(email)}, password: ${JSON.stringify(PASSWORD)} }),
      });
      const body = await response.json();
      if (!response.ok) return response.status;
      localStorage.setItem("auth_token", body.data.token);
      return response.status;
    })()`,
  );

  if (status !== 200) {
    throw new Error(`sign in for ${email} failed with ${status}`);
  }
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                           */
/* ------------------------------------------------------------------ */

section("Fixtures");

const mentor = { cookie: "" };
const mentorLogin = await api(mentor, "POST", "/auth/login", {
  email: "mentor@example.com",
  password: PASSWORD,
});
if (mentorLogin.status !== 200) {
  console.error(`the mentor could not be signed in (${mentorLogin.status})`);
  process.exit(1);
}

const catalog = await api(mentor, "GET", "/projects");
const projects = (catalog.payload?.data?.projects ?? []).filter(
  (project) => project.id !== "legacy-01",
);
const [A, B, C] = projects;

// A first attempt, waiting for a mentor.
const first = await makeStudent("first");
const firstCreate = await api(first.session, "POST", "/submissions", body(A.id));

// A rejected attempt that was handed in again: the retained review belongs to
// the previous attempt.
const retained = await makeStudent("retained");
const retainedCreate = await api(
  retained.session,
  "POST",
  "/submissions",
  body(B.id),
);
await api(
  mentor,
  "PATCH",
  `/submissions/${retainedCreate.payload.data.submission.id}/status`,
  { status: "REJECTED", feedback: "The first pass was missing tests." },
);
await api(
  retained.session,
  "PUT",
  `/submissions/${retainedCreate.payload.data.submission.id}/resubmit`,
  {
    repoUrl: "https://github.com/student/phase-00-ui-second",
    liveUrl: "https://phase-00-ui-second.vercel.app",
    description: "The second pass, with the tests that were asked for.",
  },
);

// A resubmission that was rejected again: the review on the row now belongs to
// the attempt that is on screen.
const reviewed = await makeStudent("reviewed");
const reviewedCreate = await api(
  reviewed.session,
  "POST",
  "/submissions",
  body(C.id),
);
await api(
  mentor,
  "PATCH",
  `/submissions/${reviewedCreate.payload.data.submission.id}/status`,
  { status: "REJECTED", feedback: "The first pass was missing tests." },
);
await api(
  reviewed.session,
  "PUT",
  `/submissions/${reviewedCreate.payload.data.submission.id}/resubmit`,
  {
    repoUrl: "https://github.com/student/phase-00-ui-third",
    liveUrl: "https://phase-00-ui-third.vercel.app",
    description: "The second pass.",
  },
);
await api(
  mentor,
  "PATCH",
  `/submissions/${reviewedCreate.payload.data.submission.id}/status`,
  { status: "REJECTED", feedback: "The second pass was missing types." },
);

console.log("fixtures created");

/* ------------------------------------------------------------------ */
/* The dashboard                                                      */
/* ------------------------------------------------------------------ */

section("Dashboard");

await signIn(first.email);
await open(`${WEB}/student/dashboard`);
await waitFor(
  `document.body.innerText.includes(${JSON.stringify(A.id)})`,
  "the first submission to appear",
);

const firstState = await evaluate(
  `(() => {
    const text = document.body.innerText;
    const chip = [...document.querySelectorAll("span")].find(
      (element) => element.textContent.trim() === ${JSON.stringify(A.id)},
    );
    return {
      chip: Boolean(chip),
      chipText: chip ? chip.textContent.trim() : null,
      attempt: text.includes("Attempt 1"),
      status: text.includes("Awaiting mentor review"),
      projectName: text.includes(${JSON.stringify(A.name)}),
    };
  })()`,
);

check(
  "FR-09",
  "the submission shows its catalog code",
  firstState.chip,
  firstState.chipText ?? "no chip",
);
check(
  "FR-09",
  "the submission shows its project name",
  firstState.projectName,
);
check("VAL-45", "the attempt number is shown", firstState.attempt);
check(
  "VAL-42",
  "the status of the submission is shown",
  firstState.status,
);

// The picker — VAL-39, VAL-40, VAL-41, VAL-51, VAL-53.
await evaluate(`document.getElementById("projectId").click()`);
await waitFor(`document.querySelector("[role=dialog]")`, "the picker to open");

const dialogState = await evaluate(
  `(() => {
    const dialog = document.querySelector("[role=dialog]");
    const buttons = [...dialog.querySelectorAll("button")];
    const codeOf = (button) => {
      const code = [...button.querySelectorAll("span")]
        .map((span) => span.textContent.trim())
        .find((text) => /^[a-z]{2,}-\\d{2}$/.test(text));
      return code ?? null;
    };

    const submitted = buttons.find(
      (button) => codeOf(button) === ${JSON.stringify(A.id)},
    );
    const available = buttons.find((button) =>
      button.innerText.includes("Available to submit"),
    );

    return {
      codes: buttons.map(codeOf).filter(Boolean),
      submittedText: submitted ? submitted.innerText : null,
      submittedDisabled: submitted
        ? submitted.getAttribute("aria-disabled")
        : null,
      submittedNativeDisabled: submitted ? submitted.disabled : null,
      availableText: available ? available.innerText : null,
    };
  })()`,
);

check(
  "VAL-39",
  "the picker is filled with the catalog",
  dialogState.codes.length >= 5,
  `${dialogState.codes.length} codes`,
);
check(
  "VAL-41",
  "an already submitted project is identified",
  (dialogState.submittedText ?? "").includes("Already submitted"),
  (dialogState.submittedText ?? "").replace(/\s+/g, " ").slice(0, 90),
);
check(
  "VAL-53",
  "the state of an option is spelled out in text",
  (dialogState.submittedText ?? "").includes("in review"),
);
check(
  "VAL-53",
  "an unavailable option is marked with aria-disabled",
  dialogState.submittedDisabled === "true",
  `aria-disabled=${dialogState.submittedDisabled}`,
);
check(
  "VAL-51",
  "an unavailable option is not removed from the keyboard order",
  dialogState.submittedNativeDisabled === false,
  `disabled=${dialogState.submittedNativeDisabled}`,
);
check(
  "VAL-41",
  "an available project is marked as available",
  (dialogState.availableText ?? "").includes("Available to submit"),
);

// The unavailable option can be reached with the keyboard.
const focusable = await evaluate(
  `(() => {
    const dialog = document.querySelector("[role=dialog]");
    const unavailable = [...dialog.querySelectorAll("button")].find(
      (button) => button.getAttribute("aria-disabled") === "true",
    );
    if (!unavailable) return { found: false };
    unavailable.focus();
    return {
      found: true,
      focused: document.activeElement === unavailable,
      tabIndex: unavailable.tabIndex,
    };
  })()`,
);
check(
  "VAL-51",
  "an unavailable option can still be focused",
  focusable.found && focusable.focused,
  `tabIndex ${focusable.tabIndex}`,
);

// The unavailable option refuses activation.
const refused = await evaluate(
  `(() => {
    const dialog = document.querySelector("[role=dialog]");
    const unavailable = [...dialog.querySelectorAll("button")].find(
      (button) => button.getAttribute("aria-disabled") === "true",
    );
    unavailable.click();
    return {
      stillOpen: Boolean(document.querySelector("[role=dialog]")),
      selected: Boolean(
        document.querySelector('[aria-pressed="true"], [aria-current="true"]'),
      ),
    };
  })()`,
);
check(
  "VAL-53",
  "an unavailable option cannot be picked",
  refused.stillOpen && !refused.selected,
);

// An available project is picked.
await evaluate(
  `(() => {
    const dialog = document.querySelector("[role=dialog]");
    const available = [...dialog.querySelectorAll("button")].find((button) =>
      button.innerText.includes("Available to submit"),
    );
    available.click();
    return true;
  })()`,
);
await sleep(500);

const selectedState = await evaluate(
  `(() => {
    const trigger = document.getElementById("projectId");
    return {
      text: trigger.innerText.replace(/\\s+/g, " ").trim(),
      expanded: trigger.getAttribute("aria-expanded"),
      dialogOpen: Boolean(document.querySelector("[role=dialog]")),
    };
  })()`,
);
check(
  "VAL-40",
  "the selected project is shown in the control",
  selectedState.text.length > 0 &&
    !selectedState.text.includes("Select a project"),
  selectedState.text,
);
check(
  "VAL-52",
  "the trigger reports that it is closed again",
  selectedState.expanded === "false" && !selectedState.dialogOpen,
  `aria-expanded=${selectedState.expanded}`,
);

/* ------------------------------------------------------------------ */
/* The catalog state is announced once                                 */
/* ------------------------------------------------------------------ */

section("The catalog state");

// The catalog request is held open, so the catalog stays in its loading state
// while the picker is open.
await send(
  "Fetch.enable",
  {
    patterns: [
      {
        urlPattern: "*://localhost:5000/api/projects*",
        requestStage: "Request",
      },
    ],
  },
  sessionId,
);

await navigate(`${WEB}/student/dashboard`);
await waitFor(
  `document.body.innerText.includes("Loading the project catalog")`,
  "the catalog to be loading",
);

const closedState = await evaluate(
  `(() => {
    const regions = [...document.querySelectorAll('[role="status"]')].filter(
      (element) => element.textContent.includes("Loading the project catalog"),
    );
    return {
      count: regions.length,
      outside: regions.filter(
        (element) => !element.closest("[role=dialog]"),
      ).length,
    };
  })()`,
);
check(
  "VAL-49",
  "the catalog state is shown while the picker is closed",
  closedState.count === 1 && closedState.outside === 1,
  `${closedState.count} regions, ${closedState.outside} outside the dialog`,
);

await evaluate(`document.getElementById("projectId").click()`);
await waitFor(`document.querySelector("[role=dialog]")`, "the picker to open");

const openState = await evaluate(
  `(() => {
    const regions = [...document.querySelectorAll('[role="status"]')].filter(
      (element) => element.textContent.includes("Loading the project catalog"),
    );
    return {
      count: regions.length,
      outside: regions.filter(
        (element) => !element.closest("[role=dialog]"),
      ).length,
      inside: regions.filter((element) =>
        element.closest("[role=dialog]"),
      ).length,
    };
  })()`,
);
check(
  "VAL-49",
  "the catalog state is announced once, inside the dialog",
  openState.count === 1 && openState.inside === 1 && openState.outside === 0,
  `${openState.count} regions, ${openState.outside} outside the dialog`,
);

for (const requestId of heldRequests.splice(0)) {
  await send("Fetch.continueRequest", { requestId }, sessionId).catch(() => {});
}
await send("Fetch.disable", {}, sessionId);

/* ------------------------------------------------------------------ */
/* The retained review                                                */
/* ------------------------------------------------------------------ */

section("Retained review");

await signIn(retained.email);
await open(`${WEB}/student/dashboard`);
await waitFor(
  `document.body.innerText.includes("The first pass was missing tests.")`,
  "the retained review to appear",
);

const retainedState = await evaluate(
  `(() => {
    const text = document.body.innerText;
    return {
      notes: text.includes("The first pass was missing tests."),
      previous: text.includes("Previous attempt"),
      previousAttempt: text.includes("attempt 1"),
      assessment: text.includes("Assessment of attempt 1"),
      verified: text.includes("Verified assessment record"),
      attempt: text.includes("Attempt 2"),
    };
  })()`,
);

check(
  "VAL-44",
  "the review stays visible after the resubmission",
  retainedState.notes,
);
check(
  "VAL-44",
  "the review is labelled as the previous attempt",
  retainedState.previous && retainedState.previousAttempt,
);
check(
  "VAL-44",
  "the card names the attempt the review belongs to",
  retainedState.assessment,
);
check(
  "F2",
  "a retained review is not presented as the current verdict",
  !retainedState.verified,
);
check("VAL-45", "the current attempt number is shown", retainedState.attempt);

/* ------------------------------------------------------------------ */
/* A review of the current attempt                                    */
/* ------------------------------------------------------------------ */

section("Reviewed attempt");

await signIn(reviewed.email);
await open(`${WEB}/student/dashboard`);
await waitFor(
  `document.body.innerText.includes("The second pass was missing types.")`,
  "the second review to appear",
);

const reviewedState = await evaluate(
  `(() => {
    const text = document.body.innerText;
    return {
      notes: text.includes("The second pass was missing types."),
      previous: text.includes("Previous attempt"),
      assessmentOfPrevious: text.includes("Assessment of attempt"),
      verified: text.includes("Verified assessment record"),
      stale: text.includes("The first pass was missing tests."),
      attempt: text.includes("Attempt 2"),
    };
  })()`,
);

check("VAL-38", "the new review is shown", reviewedState.notes);
check(
  "F2",
  "a review of the current attempt is not labelled as an earlier one",
  !reviewedState.previous && !reviewedState.assessmentOfPrevious,
);
check(
  "F2",
  "a review of the current attempt is presented as the current verdict",
  reviewedState.verified,
);
check("VAL-38", "the replaced review is gone", !reviewedState.stale);
check("VAL-45", "the attempt number is shown", reviewedState.attempt);

/* ------------------------------------------------------------------ */
/* Handing in another project                                         */
/* ------------------------------------------------------------------ */

section("Handing in another project");

const fresh = await makeStudent("fresh");
await signIn(fresh.email);
await open(`${WEB}/student/dashboard`);
await waitFor(`document.getElementById("projectId")`, "the submission form");

await evaluate(`document.getElementById("projectId").click()`);
await waitFor(`document.querySelector("[role=dialog]")`, "the picker to open");

await evaluate(
  `(() => {
    const dialog = document.querySelector("[role=dialog]");
    const option = [...dialog.querySelectorAll("button")].find((button) =>
      button.innerText.includes("Available to submit"),
    );
    option.click();
    return true;
  })()`,
);
await sleep(500);

await evaluate(
  `(() => {
    const setValue = (element, value) => {
      const setter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(element),
        "value",
      ).set;
      setter.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    };
    setValue(
      document.getElementById("repoUrl"),
      "https://github.com/student/phase-00-ui-new",
    );
    setValue(
      document.getElementById("liveUrl"),
      "https://phase-00-ui-new.vercel.app",
    );
    setValue(
      document.getElementById("description"),
      "A second project, handed in after the first one.",
    );
    return true;
  })()`,
);
await sleep(300);

await evaluate(
  `(() => {
    document.querySelector('button[type="submit"]').click();
    return true;
  })()`,
);

await waitFor(
  `document.body.innerText.includes("Awaiting mentor review")`,
  "the submission to be accepted",
  25000,
);

const afterSubmit = await evaluate(
  `(() => {
    const trigger = document.getElementById("projectId");
    return {
      trigger: trigger.innerText.replace(/\\s+/g, " ").trim(),
      repoUrl: document.getElementById("repoUrl").value,
      liveUrl: document.getElementById("liveUrl").value,
      description: document.getElementById("description").value,
    };
  })()`,
);

check(
  "FR-09",
  "the form is cleared after a submission",
  afterSubmit.repoUrl === "" &&
    afterSubmit.liveUrl === "" &&
    afterSubmit.description === "",
  JSON.stringify(afterSubmit),
);
check(
  "FR-09",
  "the project picker is cleared after a submission",
  afterSubmit.trigger.includes("Select a project"),
  afterSubmit.trigger,
);

/* ------------------------------------------------------------------ */
/* Cleanup                                                            */
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

const leftovers = await query(
  `SELECT COUNT(*)::int AS count FROM "User" WHERE email LIKE 'phase00-ui-%'`,
);
check(
  "Cleanup",
  "the throwaway accounts are removed",
  leftovers.rows[0].count === 0,
  `${leftovers.rows[0].count} accounts left`,
);

await pool.end();
socket.close();
chrome.kill();
rmSync(userDataDir, { recursive: true, force: true });

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

if (failed.length > 0) {
  console.log("\nFailed checks:");
  for (const result of failed) {
    console.log(`  ${result.val}  ${result.label}`);
  }
}

process.exit(failed.length > 0 ? 1 : 0);
