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
/** The origin the API allows, which is also the origin the page is served from. */
const CLIENT_URL = env.CLIENT_URL || WEB;
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
/**
 * Replaces the response of the next request it matches.
 *
 * `null` means "this request is not the one under test", which lets it
 * through so the page keeps working while a failure is in place.
 */
let responder = null;
/**
 * True while the intercepted requests are meant to stay open.
 *
 * The catalog state is only observable while the catalog request is in flight,
 * so that request is held rather than answered. Every other intercepted
 * request is let through.
 */
let holdRequests = false;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);

  if (message.method === "Page.loadEventFired") {
    loadWaiters.splice(0).forEach((resolve) => resolve());
    return;
  }

  if (message.method === "Fetch.requestPaused") {
    const { requestId, request } = message.params;
    const answer = responder ? responder(request) : null;

    if (answer) {
      responder = null;
      send(
        "Fetch.fulfillRequest",
        {
          requestId,
          responseCode: answer.status,
          responseHeaders: [
            { name: "Content-Type", value: "application/json" },
            // The API is a different origin than the page, so the browser
            // checks the answer against the CORS rules. Without these headers
            // the request is blocked and the page sees a network failure
            // rather than the answer that was put in place.
            { name: "Access-Control-Allow-Origin", value: CLIENT_URL },
            { name: "Access-Control-Allow-Credentials", value: "true" },
          ],
          body: Buffer.from(JSON.stringify(answer.payload)).toString("base64"),
        },
        sessionId,
      ).catch(() => {});
      // The interception has served its purpose, so it is turned off again
      // and the requests that follow are left alone.
      send("Fetch.disable", {}, sessionId).catch(() => {});
      return;
    }

    if (!holdRequests) {
      // This request is not held open, so it is let through.
      send("Fetch.continueRequest", { requestId }, sessionId).catch(() => {});
      return;
    }

    // The request is held open, so the catalog stays in its loading state.
    heldRequests.push(requestId);
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

/**
 * Makes the next matching request answer with the given response.
 *
 * Only the first request the matcher accepts is replaced. Every other
 * request is let through, so the page stays usable while the failure is in
 * place — a dashboard that stops loading is not what is under test here.
 */
async function interceptOnce(urlPattern, matches, response) {
  await send("Fetch.disable", {}, sessionId).catch(() => {});
  holdRequests = false;
  await send(
    "Fetch.enable",
    { patterns: [{ urlPattern, requestStage: "Request" }] },
    sessionId,
  );
  responder = (request) => (matches(request) ? response : null);
}

/** Stops intercepting and lets any held request through. */
async function stopIntercepting() {
  responder = null;
  holdRequests = false;
  for (const requestId of heldRequests.splice(0)) {
    await send("Fetch.continueRequest", { requestId }, sessionId).catch(() => {});
  }
  await send("Fetch.disable", {}, sessionId).catch(() => {});
}

/**
 * Types a value into a form field.
 *
 * React Hook Form ignores a plain `element.value =` — the value has to go
 * through the native setter and a bubbling `input` event, which is what the
 * change handler listens to.
 */
async function setFieldValue(id, value) {
  return evaluate(`
    (() => {
      const field = document.getElementById(${JSON.stringify(id)});
      if (!field) return false;
      const prototype = field instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
      setter.call(field, ${JSON.stringify(value)});
      field.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    })()
  `);
}

/** Fills the fields of a form. The prefix is "" for the form, "resubmit-" for the dialog. */
async function fillForm(prefix, values) {
  for (const [field, value] of Object.entries(values)) {
    const filled = await setFieldValue(`${prefix}${field}`, value);
    if (!filled) {
      throw new Error(`the field ${prefix}${field} was not found`);
    }
  }
}

/**
 * Picks a project from the catalog.
 *
 * The picker is a dialog, so the trigger is opened first and the option is
 * chosen from the list. The code is matched against the rendered text, so it
 * is compared in upper case — the design system upper cases the code chip.
 */
async function pickProject(catalogId) {
  await evaluate(`document.getElementById("projectId").click()`);
  await waitFor(`document.querySelector("[role=dialog]")`, "the picker to open");

  // The list is only rendered once the catalog has arrived, so the option is
  // waited for rather than looked for straight away.
  await waitFor(
    `[...document.querySelectorAll("[role=dialog] button")].some((button) =>
      button.innerText.toUpperCase().includes(${JSON.stringify(
        catalogId.toUpperCase(),
      )}),
    )`,
    `the project ${catalogId} to be offered`,
  );

  const picked = await evaluate(`
    (() => {
      const dialog = document.querySelector("[role=dialog]");
      const option = [...dialog.querySelectorAll("button")].find((button) =>
        button.innerText.toUpperCase().includes(${JSON.stringify(
          catalogId.toUpperCase(),
        )}),
      );
      if (!option) return false;
      option.click();
      return true;
    })()
  `);

  if (!picked) {
    throw new Error(`the project ${catalogId} was not offered in the picker`);
  }

  await sleep(400);
}

/** Clicks a button whose text contains the given words. */
async function clickButton(words, scope) {
  return evaluate(`
    (() => {
      const root = ${scope ? scope : "document"};
      const button = [...root.querySelectorAll("button")].find((element) =>
        element.textContent.includes(${JSON.stringify(words)}),
      );
      if (!button) return false;
      button.click();
      return true;
    })()
  `);
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
const [A, B, C, D, E] = projects;

check(
  "Fixtures",
  "the catalog holds enough projects for the checks",
  projects.length >= 5,
  `${projects.length} projects`,
);

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
// The code chip is uppercased by CSS, and `innerText` reflects the rendered
// text, so the comparison is made case-insensitively.
await waitFor(
  `document.body.innerText.toLowerCase().includes(${JSON.stringify(
    A.id.toLowerCase(),
  )})`,
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
holdRequests = true;
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
holdRequests = false;
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
    // The label is uppercased by CSS, and innerText reflects the rendered
    // text, so the label is read from textContent, which does not.
    const label = [...document.querySelectorAll("span")].find((element) =>
      element.textContent.includes("Previous attempt"),
    );

    return {
      notes: text.includes("The first pass was missing tests."),
      previous: Boolean(label),
      previousAttempt: label
        ? label.textContent.replace(/\\s+/g, " ").trim()
        : null,
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
  retainedState.previous &&
    (retainedState.previousAttempt ?? "").includes("attempt 1"),
  retainedState.previousAttempt ?? "no label",
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
    const source = document.body.textContent;
    return {
      notes: text.includes("The second pass was missing types."),
      previous: source.includes("Previous attempt"),
      assessmentOfPrevious: source.includes("Assessment of attempt"),
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

const attemptBadges = await evaluate(
  `(() => {
    const badges = [...document.querySelectorAll("span")]
      .map((element) => element.textContent.replace(/\\s+/g, " ").trim())
      .filter((text) => /^Attempt \\d+$/.test(text));
    return { badges, readable: badges.includes("Attempt 2") };
  })()`,
);
check(
  "VAL-54",
  "the attempt badge carries readable text",
  attemptBadges.readable,
  JSON.stringify(attemptBadges.badges),
);

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

// The list is only rendered once the catalog has arrived.
await waitFor(
  `[...document.querySelectorAll("[role=dialog] button")].some((button) =>
    button.innerText.includes("Available to submit"),
  )`,
  "the catalog options to be listed",
);

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
/* The empty state                                                    */
/* ------------------------------------------------------------------ */

section("The empty state");

const empty = await makeStudent("empty");
await signIn(empty.email);
await open(`${WEB}/student/dashboard`);
await waitFor(`document.getElementById("projectId")`, "the submission form");

const emptyState = await evaluate(
  `(() => {
    const text = document.body.innerText;
    return {
      empty: text.includes("No submissions yet"),
      hint: text.includes("Pick a project from the catalog below"),
      form: Boolean(document.getElementById("projectId")),
      submit: Boolean(document.querySelector('button[type="submit"]')),
      failures: [...document.querySelectorAll('[role="alert"]')].filter((element) =>
        /could not|failed|error/i.test(element.textContent),
      ).length,
    };
  })()`,
);

check(
  "VAL-46",
  "the dashboard renders an empty state",
  emptyState.empty && emptyState.hint,
  JSON.stringify(emptyState),
);
check(
  "VAL-46",
  "the submission form is available",
  emptyState.form && emptyState.submit,
  JSON.stringify(emptyState),
);
check(
  "VAL-46",
  "no error is shown for a student without submissions",
  emptyState.failures === 0,
  `${emptyState.failures} error regions`,
);

/* ------------------------------------------------------------------ */
/* The duplicate feedback                                             */
/* ------------------------------------------------------------------ */

section("The duplicate feedback");

// The server is asked for a duplicate and answers with the code that decides
// what the interface does. The message is deliberately the wrong one: an
// interface that read the message would offer the resubmission path for a
// project that is still waiting for a mentor.
await interceptOnce(
  "*localhost:5000/api/submissions",
  (request) => request.method === "POST",
  {
    status: 409,
    payload: {
      success: false,
      message:
        "This project was rejected, so it has to be resubmitted rather than submitted again.",
      code: "DUPLICATE_SUBMISSION",
    },
  },
);

await pickProject(D.id);
await fillForm("", {
  repoUrl: "https://github.com/student/phase-00-ui-duplicate",
  liveUrl: "https://phase-00-ui-duplicate.vercel.app",
  description: "A project that is already waiting for a mentor.",
});
await sleep(300);
await evaluate(`document.querySelector('button[type="submit"]').click()`);

await waitFor(
  `document.body.innerText.includes("Submission could not be completed")`,
  "the duplicate to be reported",
);

const duplicateState = await evaluate(
  `(() => {
    const banner = [...document.querySelectorAll('[role="alert"]')].find(
      (element) =>
        element.textContent.includes("Submission could not be completed"),
    );
    const text = banner ? banner.textContent : "";
    return {
      announced: Boolean(banner),
      waiting: text.includes("already submitted and waiting for a mentor"),
      misleading: text.includes("has to be resubmitted"),
      resubmit: [...document.querySelectorAll("button")].some((button) =>
        button.textContent.includes("Resubmit"),
      ),
    };
  })()`,
);

check(
  "VAL-47",
  "a duplicate submission is reported",
  duplicateState.announced,
  JSON.stringify(duplicateState),
);
check(
  "VAL-47",
  "the project is described as waiting for a mentor",
  duplicateState.waiting,
  JSON.stringify(duplicateState),
);
check(
  "VAL-47",
  "the decision comes from the code, not from the message",
  !duplicateState.misleading,
  JSON.stringify(duplicateState),
);
check(
  "VAL-47",
  "no resubmission is offered for a project in review",
  !duplicateState.resubmit,
  JSON.stringify(duplicateState),
);

// The opposite case: the project was rejected, so the interface has to point
// at the resubmission path. The message is misleading in the other
// direction, and the code is what tells the two apart.
const rejected = await makeStudent("rejected");
const rejectedCreate = await api(
  rejected.session,
  "POST",
  "/submissions",
  body(E.id),
);
await api(
  mentor,
  "PATCH",
  `/submissions/${rejectedCreate.payload.data.submission.id}/status`,
  { status: "REJECTED", feedback: "Add the missing tests." },
);

await signIn(rejected.email);
await open(`${WEB}/student/dashboard`);
await waitFor(
  `document.body.innerText.includes("Add the missing tests.")`,
  "the rejected submission to appear",
);

await interceptOnce(
  "*localhost:5000/api/submissions",
  (request) => request.method === "POST",
  {
    status: 409,
    payload: {
      success: false,
      message:
        "This project is already submitted and waiting for a mentor. It cannot be submitted again.",
      code: "RESUBMIT_REQUIRED",
    },
  },
);

await pickProject(E.id);
await fillForm("", {
  repoUrl: "https://github.com/student/phase-00-ui-conflict",
  liveUrl: "https://phase-00-ui-conflict.vercel.app",
  description: "A project that came back rejected.",
});
await sleep(300);
await evaluate(`document.querySelector('button[type="submit"]').click()`);

await waitFor(
  `document.body.innerText.includes("Submission could not be completed")`,
  "the conflict to be reported",
);

const conflictState = await evaluate(
  `(() => {
    const banner = [...document.querySelectorAll('[role="alert"]')].find(
      (element) =>
        element.textContent.includes("Submission could not be completed"),
    );
    const text = banner ? banner.textContent : "";
    return {
      announced: Boolean(banner),
      rejected: text.includes("has to be resubmitted rather than submitted again"),
      misleading: text.includes("already submitted and waiting for a mentor"),
      resubmit: banner
        ? [...banner.querySelectorAll("button")].some((button) =>
            button.textContent.includes("Resubmit"),
          )
        : false,
    };
  })()`,
);

check(
  "VAL-47",
  "a rejected project is pointed at the resubmission path",
  conflictState.rejected,
  JSON.stringify(conflictState),
);
check(
  "VAL-47",
  "the decision comes from the code, not from the message",
  !conflictState.misleading,
  JSON.stringify(conflictState),
);
check(
  "VAL-47",
  "the resubmission action is offered",
  conflictState.resubmit,
  JSON.stringify(conflictState),
);

/* ------------------------------------------------------------------ */
/* Error handling                                                     */
/* ------------------------------------------------------------------ */

section("Error handling");

// The catalog cannot be loaded.
await interceptOnce("*localhost:5000/api/projects", () => true, {
  status: 500,
  payload: { success: false, message: "The catalog could not be read." },
});

await signIn(empty.email);
await open(`${WEB}/student/dashboard`);
await waitFor(
  `document.body.innerText.includes("The project catalog could not be loaded")`,
  "the catalog failure to be reported",
);

const catalogFailure = await evaluate(
  `(() => {
    const banner = [...document.querySelectorAll('[role="alert"]')].find(
      (element) =>
        element.textContent.includes("The project catalog could not be loaded"),
    );
    const submit = document.querySelector('button[type="submit"]');
    return {
      announced: Boolean(banner),
      retry: banner
        ? [...banner.querySelectorAll("button")].some((button) =>
            button.textContent.includes("Try again"),
          )
        : false,
      blocked: submit ? submit.disabled : null,
      form: Boolean(document.getElementById("projectId")),
    };
  })()`,
);

check(
  "VAL-48",
  "a failed catalog request is reported",
  catalogFailure.announced,
  JSON.stringify(catalogFailure),
);
check(
  "VAL-48",
  "a retry is offered for the catalog",
  catalogFailure.retry,
  JSON.stringify(catalogFailure),
);
check(
  "VAL-48",
  "no submission can be made without a catalog",
  catalogFailure.blocked === true,
  JSON.stringify(catalogFailure),
);
check(
  "VAL-48",
  "the dashboard still renders after a catalog failure",
  catalogFailure.form,
  JSON.stringify(catalogFailure),
);

// The submission cannot be created.
await stopIntercepting();
await signIn(empty.email);
await open(`${WEB}/student/dashboard`);
await waitFor(`document.getElementById("projectId")`, "the submission form");

await interceptOnce(
  "*localhost:5000/api/submissions",
  (request) => request.method === "POST",
  {
    status: 500,
    payload: { success: false, message: "The submission could not be stored." },
  },
);

await pickProject(D.id);
await fillForm("", {
  repoUrl: "https://github.com/student/phase-00-ui-failed",
  liveUrl: "https://phase-00-ui-failed.vercel.app",
  description: "A deliverable the server refuses to store.",
});
await sleep(300);
await evaluate(`document.querySelector('button[type="submit"]').click()`);

await waitFor(
  `document.body.innerText.includes("Submission could not be completed")`,
  "the failed submission to be reported",
);

const createFailure = await evaluate(
  `(() => {
    const banner = [...document.querySelectorAll('[role="alert"]')].find(
      (element) =>
        element.textContent.includes("Submission could not be completed"),
    );
    const text = document.body.innerText;
    return {
      announced: Boolean(banner),
      message: banner ? banner.textContent : "",
      repoUrl: document.getElementById("repoUrl").value,
      submitted: text.includes("Awaiting mentor review"),
      empty: text.includes("No submissions yet"),
    };
  })()`,
);

check(
  "VAL-48",
  "a failed create request is reported",
  createFailure.announced,
  JSON.stringify(createFailure),
);
check(
  "VAL-48",
  "the failed submission is not shown as submitted",
  !createFailure.submitted && createFailure.empty,
  JSON.stringify(createFailure),
);
check(
  "VAL-48",
  "the form keeps what the student typed",
  createFailure.repoUrl === "https://github.com/student/phase-00-ui-failed",
  createFailure.repoUrl,
);
check(
  "VAL-55",
  "the failure is announced through an alert",
  createFailure.announced,
  JSON.stringify(createFailure),
);

// The server answers with a success it did not deliver.
await interceptOnce(
  "*localhost:5000/api/submissions",
  (request) => request.method === "POST",
  {
    status: 200,
    payload: { success: true, message: "Created" },
  },
);

await evaluate(`document.querySelector('button[type="submit"]').click()`);
await waitFor(
  `document.body.innerText.includes("Submission could not be completed")`,
  "the incomplete answer to be reported",
);

const partialState = await evaluate(
  `(() => {
    const banner = [...document.querySelectorAll('[role="alert"]')].find(
      (element) =>
        element.textContent.includes("Submission could not be completed"),
    );
    const text = document.body.innerText;
    return {
      announced: Boolean(banner),
      submitted: text.includes("Awaiting mentor review"),
      empty: text.includes("No submissions yet"),
    };
  })()`,
);

check(
  "VAL-48",
  "an incomplete answer is not rendered as a submission",
  partialState.announced &&
    !partialState.submitted &&
    partialState.empty,
  JSON.stringify(partialState),
);

// The resubmission cannot be stored.
await stopIntercepting();
await signIn(rejected.email);
await open(`${WEB}/student/dashboard`);
await waitFor(
  `document.body.innerText.includes("Add the missing tests.")`,
  "the rejected submission to appear",
);

const opened = await clickButton("Resubmit");
if (!opened) {
  throw new Error("the resubmission dialog could not be opened");
}
await waitFor(
  `document.querySelector("[role=dialog]")`,
  "the resubmission dialog to open",
);

await interceptOnce(
  "*localhost:5000/api/submissions/*/resubmit",
  (request) => request.method === "PUT",
  {
    status: 500,
    payload: { success: false, message: "The resubmission could not be stored." },
  },
);

await fillForm("resubmit-", {
  repoUrl: "https://github.com/student/phase-00-ui-resubmitted",
  liveUrl: "https://phase-00-ui-resubmitted.vercel.app",
  description: "The second pass, with the tests that were asked for.",
});
await sleep(300);
await evaluate(
  `(() => {
    const dialog = document.querySelector("[role=dialog]");
    dialog.querySelector('button[type="submit"]').click();
    return true;
  })()`,
);

await waitFor(
  `document.body.innerText.includes("Resubmission could not be completed")`,
  "the failed resubmission to be reported",
);

const resubmitFailure = await evaluate(
  `(() => {
    const dialog = document.querySelector("[role=dialog]");
    const banner = dialog
      ? [...dialog.querySelectorAll('[role="alert"]')].find((element) =>
          element.textContent.includes("Resubmission could not be completed"),
        )
      : null;
    const main = document.querySelector("main");
    const attempts = main
      ? [...main.querySelectorAll("span")]
          .map((element) => element.textContent.replace(/\\s+/g, " ").trim())
          .filter((text) => /^Attempt \\d+$/.test(text))
      : [];
    return {
      announced: Boolean(banner),
      open: Boolean(dialog),
      attempts,
      stillRejected: document.body.innerText.includes("Changes required"),
    };
  })()`,
);

check(
  "VAL-48",
  "a failed resubmission is reported",
  resubmitFailure.announced,
  JSON.stringify(resubmitFailure),
);
check(
  "VAL-48",
  "a failed resubmission does not leave the submission resubmitted",
  resubmitFailure.attempts.length > 0 &&
    resubmitFailure.attempts.every((text) => text === "Attempt 1"),
  JSON.stringify(resubmitFailure),
);
check(
  "VAL-48",
  "the submission keeps its rejected state",
  resubmitFailure.stillRejected,
  JSON.stringify(resubmitFailure),
);
check(
  "VAL-55",
  "the resubmission failure is announced through an alert",
  resubmitFailure.announced,
  JSON.stringify(resubmitFailure),
);

/* ------------------------------------------------------------------ */
/* Cleanup                                                            */
/* ------------------------------------------------------------------ */

section("Cleanup");

// A run that was aborted before it reached the cleanup leaves its accounts
// behind, and those would otherwise be counted as leftovers of every later
// run. They are swept first, then the accounts of this run are removed.
await query(
  `DELETE FROM "Submission" WHERE "studentId" IN (SELECT id FROM "User" WHERE email LIKE 'phase00-ui-%')`,
);
await query(`DELETE FROM "User" WHERE email LIKE 'phase00-ui-%'`);

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

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

if (failed.length > 0) {
  console.log("\nFailed checks:");
  for (const result of failed) {
    console.log(`  ${result.val}  ${result.label}`);
  }
}

// The teardown runs after the summary has been printed, so a locked
// temporary directory cannot hide the result of the run.
try {
  await pool.end();
  socket.close();
  chrome.kill();

  // Chrome holds on to its profile directory for a moment after it is
  // killed, so the removal is retried before it is given up on.
  await sleep(500);
  rmSync(userDataDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
} catch {
  // The temporary profile is left behind; the operating system clears the
  // temporary directory eventually.
}

process.exit(failed.length > 0 ? 1 : 0);
