# Phase 00 — Prevent Duplicate Submission Implementation Plan

## 1. Objective

Introduce a curated catalog of assignable projects and stop a student from
handing in the same project twice.

The feature has three parts:

1. **A project catalog** — a curated list of projects (id + name) that students
   pick from instead of typing a free-text project name.
2. **Per-project duplicate prevention** — a student may hold at most one
   submission per catalog project. The rule is enforced by the database, not
   only by the application.
3. **Resubmission after rejection** — a rejected submission can be handed in
   again, as a new attempt on the same record, without ever creating a second
   row for the same `(student, project)` pair.

The existing one-submission-per-student rule changes as part of this work: a
student may now hold submissions for **several different** catalog projects at
once. The constraint becomes *per project*, not *per student*.

---

## 2. Scope

### In scope

- `Project` catalog table, seeded and read-only.
- `GET /api/projects` — catalog listing.
- `POST /api/submissions` — now takes a `projectId` instead of a free-text
  `projectName`.
- `GET /api/submissions/me` — now returns a **list** of the student's
  submissions.
- `PUT /api/submissions/:id/resubmit` — new endpoint for a rejected
  submission.
- Student dashboard: project picker, multi-submission list, resubmit flow.
- Mentor table: project identity and attempt number.
- Data migration that backfills existing rows to a legacy catalog entry.

### Out of scope

- Mentor/admin UI for editing the catalog (the list is seeded; see §6).
- A review history table (an attempt counter and the retained feedback cover
  the requirement — see §5.4).
- Deadline enforcement, notifications, or any other roadmap item.

---

## 3. Current State (what the code does today)

| Area | Today |
| --- | --- |
| Schema | `Submission.studentId` is `@unique` — one submission per student, forever. |
| Schema | `Submission.projectName` is a free-text `String` written by the client. |
| Create API | `POST /api/submissions` takes `{ projectName, repoUrl, liveUrl, description }`. |
| Create API | Duplicate check is `findUnique({ where: { studentId } })` → `409`. |
| Read API | `GET /api/submissions/me` returns a single submission, `404` when there is none. |
| Student UI | `/student/dashboard` shows a form, or the one submitted project, plus a "One-time Submission Policy" banner. |
| Mentor UI | The table renders `projectName` from the submission row; search and sort use that column. |
| Frontend types | `Submission` in `client/src/lib/api/submissions.ts`; `useMySubmission` in `client/src/hooks/use-submissions.ts`. |

Two consequences of the current model have to change:

- `studentId @unique` must be dropped — it is what makes "one submission per
  student" a hard constraint.
- `GET /api/submissions/me` must stop returning a single object, because a
  student can now own several submissions.

---

## 4. Data Model

### 4.1 New `Project` model

```prisma
model Project {
  id          String   @id
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  submissions Submission[]
}
```

- `id` is a **human-readable catalog code** (`"ph-01"`), supplied by the seed
  and chosen by the student. It is deliberately not a UUID: mentors and
  students talk about "project 01" in reviews, and a stable readable code
  makes the catalog and the API payloads self-describing.
- `name` is the display name shown in the picker and in the mentor table. It is
  unique so two catalog entries can never be indistinguishable to a student.
- `description` is an optional one-line brief shown next to the option.
- `isActive` allows an entry to be retired from the picker without deleting it.
  Deleting an entry would break the `Submission` rows that reference it.

### 4.2 Changed `Submission` model

```prisma
model Submission {
  id String @id @default(uuid())

  projectId   String
  project     Project @relation(fields: [projectId], references: [id], onDelete: Restrict)
  projectName String

  repoUrl     String
  liveUrl     String
  description String

  status   SubmissionStatus @default(PENDING)
  feedback String?

  attempt       Int       @default(1)
  resubmittedAt DateTime?

  studentId    String
  reviewedById String?

  student    User  @relation("StudentSubmission", fields: [studentId], references: [id])
  reviewedBy User? @relation("SubmissionReviewer", fields: [reviewedById], references: [id])

  reviewedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([studentId, projectId])
  @@index([status])
  @@index([createdAt])
  @@index([projectId])
}
```

**Why `projectName` is kept alongside `projectId`.** `projectName` is now a
**server-written snapshot** of `Project.name` at the moment of submission. It
is never accepted from the client. Keeping it means the mentor list's
`projectName` search, its `sortBy=projectName` ordering and the frontend's
`Submission.projectName` field all keep working unchanged, and the mentor
table does not need a relation join on every row. The catalog entry remains
the source of truth for *new* submissions; the snapshot is what the student
actually handed in.

**Why `onDelete: Restrict`.** A catalog entry that is referenced by a
submission must not be deleted out from under it. The catalog is seeded, so
`Restrict` is the correct default and `isActive` is the retirement mechanism.

### 4.3 The uniqueness invariant

```prisma
@@unique([studentId, projectId])
```

This single index is the whole duplicate-prevention story:

- It is **declarative** — Prisma can create it, and it is enforced by
  PostgreSQL, so two concurrent requests cannot both win.
- A *partial* unique index (one non-rejected row per pair) is **not**
  expressible in the Prisma schema and would need hand-written SQL. The
  in-place attempt model in §5.4 is what keeps the constraint declaratively
  enforceable.

### 4.4 Migration

The migration must run against a database that may already contain
development submissions, so it is written in this order:

1. `CREATE TABLE "Project"`.
2. Insert the legacy catalog entry:
   `INSERT INTO "Project" (id, name, "isActive", "createdAt", "updatedAt") VALUES ('legacy-01', 'Legacy Submission', true, now(), now())`.
3. `ALTER TABLE "Submission" ADD COLUMN "projectId" TEXT` (nullable at first),
   `ADD COLUMN "attempt" INTEGER NOT NULL DEFAULT 1`,
   `ADD COLUMN "resubmittedAt" TIMESTAMP(3)`.
4. Backfill:
   `UPDATE "Submission" SET "projectId" = 'legacy-01', "projectName" = 'Legacy Submission' WHERE "projectId" IS NULL`.
5. `ALTER TABLE "Submission" ALTER COLUMN "projectId" SET NOT NULL`.
6. Add the foreign key `Submission_projectId_fkey` → `Project(id)`.
7. `DROP INDEX "Submission_studentId_key"` (the old one-per-student constraint).
8. `CREATE UNIQUE INDEX "Submission_studentId_projectId_key" ON "Submission"("studentId", "projectId")`.
9. `CREATE INDEX "Submission_projectId_idx" ON "Submission"("projectId")`.

Step 4 keeps `projectId` **NOT NULL** for every row, so the application never
has to reason about a submission without a project.

`attempt` defaults to `1`, so existing rows are already at attempt 1 and the
application does not need a separate backfill for it.

---

## 5. API Contract

### 5.1 `GET /api/projects`

Lists the assignable projects.

```
GET /api/projects
```

Auth: any authenticated user (`STUDENT` or `MENTOR`).
Rate limit: the global limiter only.

Response `200`:

```json
{
  "success": true,
  "message": "Projects retrieved",
  "data": {
    "projects": [
      {
        "id": "ph-01",
        "name": "Task Orchestrator",
        "description": "Distributed job scheduler with a CLI.",
        "isActive": true
      }
    ]
  }
}
```

Only `isActive = true` entries are returned. The list is ordered by `name`
ascending so the picker is stable between requests.

The endpoint is **role-agnostic** — it returns the same catalog to a student
and to a mentor. The student dashboard joins it client-side with
`GET /api/submissions/me` to work out which entries are already taken. (The
alternative — a student-only response carrying per-student state — was
rejected: it would make one endpoint serve two different contracts.)

### 5.2 `POST /api/submissions` (changed)

```
POST /api/submissions
```

Role: `STUDENT`. Rate limit: `submissionRateLimiter` (5 / 10 min / IP).

Request body:

```json
{
  "projectId": "ph-01",
  "repoUrl": "https://github.com/student/task-orchestrator",
  "liveUrl": "https://task-orchestrator.vercel.app",
  "description": "Distributed job scheduler written in TypeScript…"
}
```

`projectName` is **no longer accepted**. The server resolves the display name
from the catalog and writes the snapshot.

| Status | Condition | `code` |
| --- | --- | --- |
| `201` | Created | — |
| `400` | Body validation failed, or `projectId` is unknown / inactive | — (field error on `projectId`) |
| `401` | Missing or invalid token | — |
| `403` | Caller is not a `STUDENT` | — |
| `409` | The student already has a submission for that project | `DUPLICATE_SUBMISSION` or `RESUBMIT_REQUIRED` |
| `429` | Rate limit exceeded | — |

The two `409` cases are distinguished by a machine-readable `code` so the
client can offer the right next action instead of guessing from the message:

- `DUPLICATE_SUBMISSION` — the existing submission is `PENDING` or
  `APPROVED`. The student must wait for the review.
- `RESUBMIT_REQUIRED` — the existing submission is `REJECTED`. The student
  must use the resubmission endpoint; the create endpoint refuses.

**The `code` field is a small, additive change to the shared error contract.**
`ApiError` gains an optional `code`, the global error middleware copies it
into the response body when present, and the client's `ApiRequestError` gains
an optional `code`. The field is optional, so every existing error response
stays byte-for-byte the same.

### 5.3 `GET /api/submissions/me` (changed)

```
GET /api/submissions/me
```

Role: `STUDENT`.

Response `200`:

```json
{
  "success": true,
  "message": "Submissions retrieved",
  "data": {
    "submissions": [
      {
        "id": "…",
        "projectId": "ph-01",
        "projectName": "Task Orchestrator",
        "repoUrl": "…",
        "liveUrl": "…",
        "description": "…",
        "status": "REJECTED",
        "feedback": "Missing test coverage.",
        "attempt": 2,
        "resubmittedAt": "2026-10-22T10:04:00.000Z",
        "reviewedAt": "2026-10-20T09:00:00.000Z",
        "studentId": "…",
        "submittedAt": "2026-10-18T12:00:00.000Z",
        "createdAt": "2026-10-18T12:00:00.000Z",
        "updatedAt": "2026-10-22T10:04:00.000Z"
      }
    ]
  }
}
```

The response is a **list**, and it is **always `200` with an empty array** —
never `404`. "You have not submitted anything" is a normal state, not an
error, and the student dashboard renders an empty state from it. The old
`404` contract is retired.

### 5.4 `PUT /api/submissions/:id/resubmit` (new)

```
PUT /api/submissions/:id/resubmit
```

Role: `STUDENT`. Rate limit: `submissionRateLimiter`.

Request body:

```json
{
  "repoUrl": "https://github.com/student/task-orchestrator",
  "liveUrl": "https://task-orchestrator.vercel.app",
  "description": "…with the missing tests added."
}
```

The project is **not** part of the body. A resubmission is always for the
project the row already belongs to.

| Status | Condition | `code` |
| --- | --- | --- |
| `200` | Resubmitted | — |
| `400` | Body validation failed | — |
| `401` | Missing or invalid token | — |
| `403` | Caller is not a `STUDENT`, or does not own the submission | — |
| `404` | No submission with that id | — |
| `409` | The submission is not `REJECTED` | `NOT_RESUBMITTABLE` |
| `429` | Rate limit exceeded | — |

**What a resubmission writes:**

| Field | New value |
| --- | --- |
| `status` | `PENDING` |
| `attempt` | `attempt + 1` |
| `resubmittedAt` | now |
| `repoUrl`, `liveUrl`, `description` | the new values from the body |
| `projectId`, `projectName` | unchanged |
| `feedback` | **retained** — the student still needs to read the rejection |
| `reviewedAt`, `reviewedById` | **retained** — they describe the last review |

The retained `feedback` and `reviewedAt` are what make the attempt model
work: the student sees *why* the previous attempt failed while the new
attempt sits in the queue, and the mentor sees which attempt they are
reviewing. The UI labels the retained notes as belonging to the previous
attempt.

**What a resubmission does not touch:** it never creates a row. The
`(studentId, projectId)` unique index therefore holds for the whole life of
the submission, and the attempt number is the only thing that grows.

### 5.5 `GET /api/submissions` (mentor list — changed)

The existing endpoint keeps its shape. Two fields are added to the selected
columns:

- `projectId` — the catalog code, so the table can filter and link.
- `attempt` — so the table can show that a row has been resubmitted.

`projectName` (the snapshot) remains the searched and sorted column, so the
existing query behaviour is untouched. An **optional** `projectId` filter is
added to the list query, allowing the mentor table to narrow to one catalog
project. It is optional so the default table view is unchanged.

### 5.6 `PATCH /api/submissions/:id/status` (mentor review — unchanged)

The mentor's review decision behaves exactly as before, with one addition:
when a mentor reviews a resubmission, the new `feedback` **replaces** the
retained feedback of the previous attempt, and `reviewedAt` / `reviewedById`
are updated. The attempt number is not changed by a review.

---

## 6. Catalog Management

The catalog lives in the database and is populated by the Prisma seed.

`server/prisma/seed.ts` gains a typed catalog array and an idempotent upsert
loop:

```ts
const PROJECT_CATALOG = [
  { id: "ph-01", name: "Task Orchestrator", description: "…" },
  { id: "ph-02", name: "Realtime Chat",    description: "…" },
] as const;
```

Each entry is upserted by `id`: running the seed again updates the name and
description of an existing entry and inserts the ones that are new, so the
seed is safe to re-run — the same property the mentor seed already has.

**The list is yours to fill in.** The seed ships with a small placeholder
catalog; replace it with the real project list before the feature is
demonstrated. Entries are never deleted by the seed, so a project that
students have already submitted survives a re-seed.

The catalog is read-only over the API. There is no mentor CRUD endpoint in
this phase — changing the list means editing the seed and re-running it.

---

## 7. Backend Implementation

### 7.1 New module: `server/src/modules/project/`

Follows the existing module layout exactly.

| File | Responsibility |
| --- | --- |
| `project.service.ts` | `getProjectsService()` — reads the active catalog, ordered by name. |
| `project.controller.ts` | `getProjectsController` — wraps the service in `sendResponse`. |
| `project.validations.ts` | Reserved for query validation; the list endpoint takes no parameters, so this file stays minimal. |
| `project.routes.ts` | `GET /` behind `authenticate`. |

`project.routes.ts` is mounted in `server/src/routes/index.ts`:

```ts
router.use("/projects", projectRoutes);
```

### 7.2 Changed: `server/src/modules/submission/`

**`submission.validations.ts`**

- `submissionSchema` — `projectName` is replaced by
  `projectId: z.string().trim().min(1, "Project is required")`.
- `resubmitSchema` — the new body schema (`repoUrl`, `liveUrl`, `description`
  with exactly the same rules as the create schema).
- `submissionListQuerySchema` — gains an optional `projectId` filter.
- A shared `projectLinkSchema` / `repositoryUrlSchema` / `liveUrlSchema` /
  `descriptionSchema` helper keeps the URL rules identical between the create
  and resubmit bodies. The rules must not drift.

**`submission.service.ts`**

- `createSubmissionService(studentId, data)`:
  1. Verify the caller is a `STUDENT` (unchanged).
  2. Look up the catalog entry by `id`; reject with `400` and a `projectId`
     field error when it does not exist or is inactive.
  3. Look up the existing submission for `(studentId, projectId)`.
     - `PENDING` / `APPROVED` → `409` `DUPLICATE_SUBMISSION`.
     - `REJECTED` → `409` `RESUBMIT_REQUIRED`.
  4. Create the row with `projectName` set from the catalog entry (the
     snapshot), `status: "PENDING"`, `attempt: 1`.
  5. Catch Prisma `P2002` on `studentId_projectId` and convert it to the same
     `409` — this is the race-condition path, where two concurrent requests
     both passed step 3.
- `getStudentSubmissionsService(studentId)` — returns the student's
  submissions as a list, newest first. Never throws `404`.
- `resubmitSubmissionService(studentId, submissionId, data)`:
  1. Load the submission by id. `404` when it does not exist.
  2. Check ownership — a submission belonging to another student is reported
     as `404`, not `403`, so the endpoint does not confirm the existence of
     another student's row.
  3. Require `status === "REJECTED"`; otherwise `409` `NOT_RESUBMITTABLE`.
  4. Update the row exactly as described in §5.4.

**`submission.controller.ts`**

- `getMySubmissionController` — now returns `{ submissions }`.
- `createSubmissionController` — unchanged in shape; the body no longer
  carries `projectName`.
- `resubmitSubmissionController` — new.

**`submission.routes.ts`**

- `PUT "/:id/resubmit"` is registered **after** `GET "/me"` and `GET
  "/stats"`, so those literal paths are never captured by `/:id`.
- The route carries `submissionRateLimiter` — a resubmission is a submission
  attempt and must be limited the same way.

### 7.3 Changed: shared error contract

`server/src/utils/api-error.ts` — `ApiError` gains an optional `code`:

```ts
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;
  public readonly isOperational: boolean;
  /** Optional machine-readable discriminator, e.g. "DUPLICATE_SUBMISSION". */
  public readonly code?: string;
}
```

`server/src/middleware/error.middleware.ts` copies `err.code` into the
response body when it is present. No other error response changes.

### 7.4 Rate limiting — a known risk

`submissionRateLimiter` allows **5 requests per 10 minutes per IP**. That
limit was safe when a student could submit once per session. With the
catalog, a student may hand in several projects, and a cohort frequently
shares one public IP (a classroom, a campus NAT). The window is per IP, not
per user, so a full cohort behind one address can exhaust the shared budget
and start returning `429` to students who have done nothing wrong.

**Recommendation:** key the limiter on the authenticated user id when one is
present, falling back to the IP for unauthenticated requests — and raise the
limit for the submission window. This is a small change to
`submissionRateLimiter.middleware.ts` and is **in scope** for this phase,
because the catalog feature is what makes the per-IP limit bite. If it is
deferred, the limit must at least be raised before the feature is
demonstrated with more than a handful of students.

---

## 8. Frontend Implementation

### 8.1 API layer

**New — `client/src/lib/api/projects.ts`**

```ts
export interface Project {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export async function getProjectsApi(): Promise<Project[]>;
```

**Changed — `client/src/lib/api/submissions.ts`**

- `Submission` gains `projectId: string`, `attempt: number`,
  `resubmittedAt: string | null`. `projectName` stays (the snapshot).
- `CreateSubmissionPayload` replaces `projectName` with `projectId`.
- `getMySubmissionApi()` → `getMySubmissionsApi()`, returning
  `Submission[]` and resolving to `[]` rather than throwing on `404`.
- `resubmitSubmissionApi(submissionId, payload)` → `Promise<Submission>`.

**Changed — `client/src/lib/api/client.ts`**

`ApiRequestError` gains `readonly code?: string`, parsed from the response
body.

### 8.2 Query layer

`client/src/lib/query/query-keys.ts`:

- `mySubmission` → `mySubmissions` (the key is part of the contract — the
  query and every mutation that changes it must target the same key).
- New: `projects: ["projects"]`.

`client/src/hooks/use-submissions.ts`:

- `useMySubmission()` → `useMySubmissions()`.
- `useCreateSubmission()` — on `409`, invalidate `mySubmissions` so the
  dashboard re-syncs with the server.
- New: `useResubmitSubmission()` — on success, write the returned submission
  into the `mySubmissions` cache and invalidate it.

`client/src/hooks/use-projects.ts` (new):

- `useProjects()` — the catalog, with `staleTime` high enough that the
  picker does not refetch on every navigation (the catalog is effectively
  static), and `enabled: hasToken()` like the other hooks.

### 8.3 Validation

`client/src/lib/validations/submission.ts`:

- `submissionSchema` — `projectId` replaces `projectName`.
- New `resubmitSchema` — the same three URL/description rules.
- The create and resubmit schemas must be kept in lockstep with the server
  schemas, exactly as they are today.

### 8.4 Components

| Component | Change |
| --- | --- |
| `components/student/project-picker.tsx` | **New.** A `Field` whose control is a `Button` opening a `Dialog` with a search `Input` and a scrollable list of catalog options. Each option shows the code, the name, the brief, and its state (available / already submitted / rejected — resubmit). |
| `components/student/submission-form.tsx` | The free-text "Project Name" input is replaced by `<ProjectPicker />`. The rest of the form is unchanged. |
| `components/student/resubmit-form.tsx` | **New.** The resubmission body: repository, live link and description, pre-filled with the previous attempt's values, submitted with the resubmit mutation. |
| `components/student/submitted-project-card.tsx` | Shows the attempt number, the project code, and — when `status === "REJECTED"` — the mentor feedback and a **Resubmit** action. |
| `components/student/mentor-feedback-card.tsx` | When `attempt > 1`, the retained notes are labelled as belonging to the previous attempt. |
| `components/student/submission-status-panel.tsx` | The "cannot be edited after submission" notice is replaced by the resubmit affordance when the submission is `REJECTED`. |
| `components/student/submission-snapshot-card.tsx` | Becomes a compact list — a student may now have several submissions. |
| `components/mentor/submission-table.tsx` | The Project column renders the catalog code next to the name; a resubmission row is marked with an attempt chip. |

**The picker has no `Select` or `Popover` primitive** in this codebase — the
available `ui/` components are `Input`, `Dialog`, `Field`, `Badge`, `Button`,
`Tabs`, `ToggleGroup` and `Sheet`. The picker is therefore built from
`Button` + `Dialog` + `Input` + a list, and follows the same keyboard
contract: the trigger is a `Button` (so it is focusable and activates on
Enter/Space), the dialog traps focus, and each option is a `Button` with
`aria-pressed` / `aria-current` describing its state.

Only Material Symbols ligatures already listed in
`client/src/lib/material-symbols.ts` may be used (`sync` for the resubmit
action, `search` for the picker's search field, `assignment` / `layers` for
project identity, `check_circle` / `schedule` / `cancel` for the option
states). A ligature that is not in the subset renders as visible text
instead of an icon. If a new one is genuinely needed, add it to
`MATERIAL_SYMBOL_ICON_NAMES` and run `npm run check:icons`.

### 8.5 Student dashboard page

`client/src/app/student/dashboard/page.tsx` changes from a single-submission
view to a multi-submission one:

- The "One-time Submission Policy" banner is replaced by the new policy
  text: *you may submit any project from the catalog, once per project; a
  rejected project can be resubmitted.*
- The left column lists every submission the student owns, and below it the
  "Submit a project" panel with the picker and the form.
- A project that is already submitted is either hidden from the picker or
  shown as disabled with its state — decided by the picker design, but the
  server still refuses the duplicate either way.
- The right-hand column keeps the rubric and office-hours panels; the
  snapshot panel becomes a list.

`client/src/app/student/submission/page.tsx` (the full submission view) must
be updated for the same list-shaped contract.

### 8.6 Mentor dashboard

- The list response gains `projectId` and `attempt`.
- The optional `projectId` filter is exposed as a filter control only if the
  mentor table design has room for it; it is not required for the feature.

---

## 9. User Flows

### 9.1 First submission

```text
Student opens /student/dashboard
      ↓
GET /api/submissions/me  → []  (empty state, no form-locking)
GET /api/projects        → the catalog
      ↓
Student opens the picker, searches, selects "ph-01"
      ↓
Fills repository, live link, description
      ↓
POST /api/submissions { projectId: "ph-01", … }
      ↓
201 → row created with projectName = "Task Orchestrator"
    → the dashboard now lists the submission with a PENDING badge
```

### 9.2 Duplicate attempt

```text
Student selects "ph-01" again and submits
      ↓
POST /api/submissions { projectId: "ph-01", … }
      ↓
409 { code: "DUPLICATE_SUBMISSION" }   (existing row is PENDING/APPROVED)
      ↓
The UI explains that the project is already in review
and offers no resubmit action
```

If the existing row is `REJECTED`, the response is
`409 { code: "RESUBMIT_REQUIRED" }` and the UI directs the student to the
existing submission's **Resubmit** action.

### 9.3 Resubmission after rejection

```text
Mentor rejects the submission with feedback
      ↓
PATCH /api/submissions/:id/status { status: "REJECTED", feedback: "…" }
      ↓
Student refreshes /student/dashboard
      ↓
The submission shows REJECTED + the mentor notes
      ↓
Student clicks "Resubmit"
      ↓
PUT /api/submissions/:id/resubmit { repoUrl, liveUrl, description }
      ↓
200 → status PENDING, attempt 2, feedback retained, resubmittedAt stamped
    → the previous notes are still visible, labelled as attempt 1
```

### 9.4 Two students, one project

Two students may both submit `ph-01` — the constraint is per student, not
per project. The mentor table shows both rows.

---

## 10. Implementation Order

1. **Schema** — add `Project`, add the `Submission` columns, swap the unique
   index, write the migration, run it, regenerate the Prisma client.
2. **Seed** — add the catalog array and the idempotent upsert loop; seed the
   legacy entry; re-run the seed.
3. **Shared error contract** — add `code` to `ApiError`, the error middleware
   and the client's `ApiRequestError`.
4. **Project module** — service, controller, routes, mount in `routes/index.ts`.
5. **Submission backend** — new `projectId` schema, catalog lookup in
   `createSubmissionService`, the `P2002` mapping, the list-shaped
   `getStudentSubmissionsService`, `resubmitSubmissionService`, the new
   controller and route, the `projectId` list filter.
6. **Rate limiter** — key on the user id and raise the submission limit.
7. **Frontend API + hooks** — `projects.ts`, the changed `submissions.ts`,
   `use-projects.ts`, the changed `use-submissions.ts`, the query keys.
8. **Frontend validation** — the changed and new Zod schemas.
9. **Frontend components** — the project picker, the resubmit form, the
   changed student cards, the mentor table columns.
10. **Student dashboard** — the multi-submission layout and the new policy
    banner.
11. **Mentor dashboard** — the project code and attempt chip.
12. **Cleanup** — remove the now-dead `projectName` input path, the
    `mySubmission` query key, and the `404` handling for `/submissions/me`.
13. **Verification** — the validation scenarios in `validations.md`.

---

## 11. Risks and Design Decisions

| # | Decision | Rationale | Cost |
| --- | --- | --- | --- |
| 1 | The constraint is `@@unique([studentId, projectId])`, not a partial index. | Prisma cannot declare a partial unique index; a hand-written SQL migration would be needed and would drift from the schema. | Resubmissions reuse the row. |
| 2 | `projectName` is kept as a server-written snapshot. | The mentor table's search, sort and frontend type keep working with no relation join. | Two places hold the name; the server is the only writer. |
| 3 | Resubmission reuses the row with an `attempt` counter. | Keeps the unique index declaratively enforceable; a separate history table is a larger change than the requirement needs. | The previous attempt's values are overwritten — only the feedback is retained. |
| 4 | The retained feedback is kept through the resubmission. | The student needs to read why the previous attempt failed while the new one is queued. | The UI must label the notes as belonging to the previous attempt. |
| 5 | `GET /api/submissions/me` returns `200` with an empty array, never `404`. | "Nothing submitted yet" is a normal state, and the dashboard now renders a list. | A breaking change to the endpoint contract and its client. |
| 6 | The catalog is seeded and read-only. | The list is a fixed cohort curriculum; runtime editing is not needed. | Changing the list means re-running the seed. |
| 7 | The `code` discriminator is added to the shared error contract. | The client must offer "resubmit" versus "already in review" without parsing English. | An optional field on one shared class and one middleware. |
| 8 | The rate limiter is keyed on the user id, not the IP. | A cohort behind one IP would otherwise exhaust a shared 5-per-10-minutes budget. | The limiter can no longer throttle an unauthenticated flood. |

**Open item — the catalog contents.** The seed ships with placeholder entries.
The real project list is a product decision and must be supplied before the
feature is demonstrated. The catalog shape (`id`, `name`, `description`,
`isActive`) does not depend on how many entries there are.

---

## 12. Completion Criteria

The phase is complete when:

- [ ] `GET /api/projects` returns the seeded catalog, ordered by name.
- [ ] `POST /api/submissions` accepts a `projectId` and rejects a free-text
      `projectName`.
- [ ] A student cannot create two submissions for the same project — enforced
      by the database index, not only by application code.
- [ ] A student **can** hold submissions for several different projects.
- [ ] A rejected submission can be resubmitted; the attempt counter increments
      and the status returns to `PENDING`.
- [ ] A `PENDING` or `APPROVED` submission cannot be resubmitted.
- [ ] The student dashboard lists every submission and offers the catalog
      picker.
- [ ] The mentor table shows the project and the attempt number.
- [ ] Existing submissions were migrated to the legacy catalog entry without
      losing data.
- [ ] The seed is idempotent and re-runnable.
- [ ] Every scenario in `validations.md` passes.
