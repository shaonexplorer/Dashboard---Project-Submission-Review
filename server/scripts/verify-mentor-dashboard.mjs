/**
 * End-to-end check of the mentor dashboard API.
 *
 * Reads the mentor credentials from `server/.env` without printing them and
 * keeps the session cookie in memory.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

if (!PASSWORD) {
  console.error("SEED_MENTOR_PASSWORD is not set in server/.env");
  process.exit(1);
}

let cookie = "";

async function call(method, path_, body, { withCookie = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (withCookie && cookie) headers.Cookie = cookie;

  const response = await fetch(`${API}${path_}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    cookie = setCookie.split(";")[0];
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { status: response.status, payload };
}

function show(label, result, extra) {
  console.log(`\n--- ${label} -> ${result.status}`);
  if (extra) console.log(extra);
  console.log(JSON.stringify(result.payload, null, 2).slice(0, 1200));
}

function expect(label, result, expected) {
  const ok = result.status === expected;
  console.log(
    `\n--- ${label} -> ${result.status} (expected ${expected}) ${ok ? "OK" : "FAILED"}`,
  );
  return ok;
}

const login = await call("POST", "/auth/login", {
  email: "mentor@example.com",
  password: PASSWORD,
});
show("login as mentor", login);

if (login.status !== 200) {
  process.exit(1);
}

const list = await call(
  "GET",
  "/submissions?page=1&limit=10&sortBy=createdAt&sortOrder=desc",
);
show("list submissions", list);

const stats = await call("GET", "/submissions/stats");
show("stats", stats);

const filtered = await call(
  "GET",
  "/submissions?page=1&limit=10&status=PENDING&search=a&sortBy=projectName&sortOrder=asc",
);
show("filtered list (status + search + sort)", filtered);

const first = list.payload?.data?.[0];
if (first) {
  const patched = await call("PATCH", `/submissions/${first.id}/status`, {
    status: "APPROVED",
    feedback: "Verified end to end by the mentor dashboard API check.",
  });
  show("patch status -> APPROVED", patched);

  const after = await call("GET", "/submissions/stats");
  show("stats after approval", after);
}

// The mentor session must not be enough to reach the mentor endpoints as an
// anonymous visitor, so the cookie is dropped before the request.
cookie = "";
const anonymous = await call("GET", "/submissions", undefined, {
  withCookie: false,
});
expect("list without a session", anonymous, 401);

// A student account must not be able to read the queue either. The probe
// account is a local, throwaway one: it is created on the first run and reused
// afterwards.
const probeEmail = "mentor-dashboard-probe@example.com";
const signup = await call("POST", "/auth/signup", {
  fullName: "Mentor Dashboard Probe",
  email: probeEmail,
  password: PASSWORD,
});

if (signup.status === 409) {
  const studentLogin = await call("POST", "/auth/login", {
    email: probeEmail,
    password: PASSWORD,
  });

  if (studentLogin.status !== 200) {
    console.error("the probe student account could not be signed in to");
    process.exit(1);
  }
} else if (signup.status !== 201 && signup.status !== 200) {
  console.error(`the probe student account could not be created (${signup.status})`);
  process.exit(1);
}

const studentList = await call("GET", "/submissions");
expect("list as a student", studentList, 403);

const studentStats = await call("GET", "/submissions/stats");
expect("stats as a student", studentStats, 403);

const studentPatch = await call("PATCH", `/submissions/${first?.id ?? "missing"}/status`, {
  status: "APPROVED",
});
expect("patch status as a student", studentPatch, 403);
