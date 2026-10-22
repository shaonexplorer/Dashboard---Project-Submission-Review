# Phase 00 — Prevent Duplicate Submission Requirements

## 1. Functional Requirements

### FR-01 — Project Catalog Model

The system must persist a catalog of assignable projects.

Each catalog entry must provide:

```text
id           Stable, human-readable catalog code (e.g. "ph-01")
name         Display name shown to students and mentors
description  Optional short brief
isActive     Whether the entry is currently assignable
```

Requirements:

- `id` must be unique and must not be a generated UUID — it is a readable
  code chosen when the catalog is defined.
- `name` must be unique.
- A catalog entry that is referenced by a submission must not be deletable
  while the reference exists.
- The catalog must be able to hold entries that are no longer assignable
  without deleting them.

---

### FR-02 — Catalog Seeding

The catalog must be populated by a deterministic, idempotent seed.

- The seed must define the catalog as a typed, human-editable list.
- Running the seed repeatedly must not create duplicates.
- Re-running the seed must update the name and description of an existing
  entry and insert entries that are new.
- The seed must not delete catalog entries that students have already
  submitted.

---

### FR-03 — Catalog Listing Endpoint

The system must expose the catalog over the API.

```http
GET /api/projects
```

Requirements:

- The endpoint must require authentication.
- The endpoint must be available to both `STUDENT` and `MENTOR` roles.
- Only entries with `isActive = true` may be returned.
- The list must be ordered deterministically (by name, ascending).
- The response must use the project's standard success envelope.

Example:

```json
{
  "success": true,
  "message": "Projects retrieved",
  "data": {
    "projects": [
      { "id": "ph-01", "name": "Task Orchestrator", "description": "…", "isActive": true }
    ]
  }
}
```

---

### FR-04 — Project-Selected Submission

A student must choose the project from the catalog rather than typing a name.

```http
POST /api/submissions
```

The request body must contain:

```text
projectId
repoUrl
liveUrl
description
```

Requirements:

- `projectName` must no longer be accepted from the client.
- The server must resolve the display name from the catalog and store it
  alongside the submission.
- `repoUrl`, `liveUrl` and `description` must keep the validation rules they
  have today (GitHub-only repository URL, HTTP/HTTPS live URL, length
  limits).
- The `projectId` must exist in the catalog and must be active. Otherwise the
  request must be rejected with a field-level error on `projectId`.
- The student identity must come from the authenticated request context, never
  from the body.

---

### FR-05 — Per-Project Duplicate Prevention

A student must not hold two submissions for the same catalog project.

Requirements:

- The constraint must be enforced by the database, through a unique index on
  the `(studentId, projectId)` pair.
- The application must also check before inserting, so the common case
  returns a clear message rather than a constraint violation.
- A concurrent insert that loses the race must still return the same
  conflict response.
- The student must still be able to hold submissions for **different**
  projects at the same time.

Conflict responses must distinguish two cases through a machine-readable
`code`:

| `code` | Meaning |
| --- | --- |
| `DUPLICATE_SUBMISSION` | An existing submission for that project is `PENDING` or `APPROVED`. |
| `RESUBMIT_REQUIRED` | The existing submission for that project is `REJECTED` and must be resubmitted rather than created again. |

Both must be returned with status `409`.

---

### FR-06 — Resubmission After Rejection

A rejected submission must be submittable again.

```http
PUT /api/submissions/:id/resubmit
```

Requirements:

- The endpoint must require a `STUDENT`.
- The body must contain `repoUrl`, `liveUrl` and `description`. It must not
  contain a project — a resubmission always belongs to the project the
  submission already references.
- The submission must be owned by the authenticated student.
- The submission must be in the `REJECTED` state. Any other state must be
  refused with `409` and the code `NOT_RESUBMITTABLE`.
- A resubmission must never create a second row for the same
  `(studentId, projectId)` pair.

A successful resubmission must:

```text
status        → PENDING
attempt       → incremented by one
resubmittedAt → set to the current timestamp
repoUrl       → the submitted value
liveUrl       → the submitted value
description   → the submitted value
```

and must leave unchanged:

```text
projectId
projectName
feedback          (the rejection reason stays readable)
reviewedAt
reviewedById
```

---

### FR-07 — Attempt Tracking

Every submission must carry an attempt number.

- A newly created submission starts at attempt `1`.
- Every successful resubmission increments it by one.
- The attempt number must be returned by the API and must be visible in the
  student and mentor interfaces.
- A mentor's review decision must not change the attempt number.

---

### FR-08 — Student Submission Listing

The student must be able to read every submission they own.

```http
GET /api/submissions/me
```

Requirements:

- The response must be a **list**, because a student may own several
  submissions.
- The response must be `200` with an empty array when the student has
  submitted nothing. It must not be `404` — "nothing submitted yet" is a
  normal state, not an error.
- The list must be ordered with the most recent submission first.
- Only the authenticated student's own submissions may be returned.

---

### FR-09 — Student Dashboard — Multiple Submissions

The student dashboard must present every submission the student owns.

Requirements:

- Each submission must show its project name, catalog code, status, attempt
  number, submission timestamp and links.
- The dashboard must offer a way to submit an additional project from the
  catalog.
- A project the student has already submitted must be identified as such in
  the picker.
- The policy text on the dashboard must state the actual rule: one
  submission per project, with resubmission allowed after a rejection.
- The existing single-submission banner and the single-submission layout
  must be replaced.

---

### FR-10 — Project Picker

The student must select the project through a picker built from the catalog.

Requirements:

- The picker must be populated from `GET /api/projects`, never from a
  hard-coded list in the client.
- The picker must support searching when the catalog is large.
- Each option must show enough information for the student to recognise the
  project — at minimum the name and the code.
- The picker must indicate the state of each option: available, already
  submitted, or rejected and available for resubmission.
- The picker must be operable by keyboard, and the selected value must be
  announced to assistive technologies.
- The selected project must be submitted to the API as `projectId`.

---

### FR-11 — Resubmission Interface

A rejected submission must offer a resubmission path.

Requirements:

- The resubmission action must only be offered when the submission is
  `REJECTED`.
- The form must be pre-filled with the previous attempt's repository, live
  link and description.
- The previous mentor feedback must remain visible while the student
  resubmits.
- After a successful resubmission the interface must show the new status and
  the incremented attempt number.
- A submission that is `PENDING` or `APPROVED` must not be editable.

---

### FR-12 — Retained Mentor Feedback

The feedback from a rejection must remain readable after a resubmission.

Requirements:

- A resubmission must not clear the feedback of the previous attempt.
- The interface must label the retained notes as belonging to the previous
  attempt, so they are not read as a verdict on the current one.
- A mentor's review of the new attempt replaces the feedback.

---

### FR-13 — Mentor Table — Project and Attempt

The mentor table must show the project and the attempt.

Requirements:

- The Project column must show the project name and the catalog code.
- A submission that has been resubmitted must be distinguishable from a
  first-attempt submission.
- The existing search behaviour over the project name must keep working.
- The existing sort orders must keep working.
- The list response must include `projectId` and `attempt`.

---

### FR-14 — Error Discrimination

The API must let a client distinguish the duplicate cases without parsing
human-readable message text.

Requirements:

- The error response body may carry an optional `code` field.
- The field must be optional — every existing error response must remain
  unchanged when it is absent.
- The client-side error type must expose the code.

---

### FR-15 — Migration of Existing Submissions

Existing submissions must survive the change.

Requirements:

- The migration must run against a database that already contains
  submissions.
- Every existing submission must end up with a non-null `projectId`.
- Existing submissions must be assigned to a single seeded legacy catalog
  entry.
- No existing submission may be deleted or lose data.
- Existing submissions must start at attempt `1`.

---

## 2. Data Requirements

### 2.1 Submission

A submission must provide:

```text
id
projectId
projectName        (the snapshot of the catalog name at submission time)
repoUrl
liveUrl
description
status
feedback
attempt
resubmittedAt
reviewedAt
studentId
submittedAt
createdAt
updatedAt
```

### 2.2 Catalog entry

```text
id
name
description
isActive
```

### 2.3 Client-side types

The frontend types must mirror the API contract exactly:

- `Submission` gains `projectId`, `attempt` and `resubmittedAt`.
- A new `Project` type mirrors the catalog entry.
- The create payload carries `projectId` and no longer carries `projectName`.
- A new resubmit payload carries `repoUrl`, `liveUrl` and `description`.

---

## 3. API Requirements

### 3.1 Endpoints

| Method | Endpoint | Role | Change |
| --- | --- | --- | --- |
| GET | `/api/projects` | Authenticated | **New** |
| POST | `/api/submissions` | `STUDENT` | **Changed** — `projectId` replaces `projectName` |
| GET | `/api/submissions/me` | `STUDENT` | **Changed** — returns a list, never `404` |
| PUT | `/api/submissions/:id/resubmit` | `STUDENT` | **New** |
| GET | `/api/submissions` | `MENTOR` | **Changed** — response gains `projectId`, `attempt` |
| PATCH | `/api/submissions/:id/status` | `MENTOR` | Unchanged |

### 3.2 Response codes

```text
GET  /api/projects                 200, 401
POST /api/submissions              201, 400, 401, 403, 409, 429
GET  /api/submissions/me           200, 401, 403
PUT  /api/submissions/:id/resubmit 200, 400, 401, 403, 404, 409, 429
```

### 3.3 Status codes for the project module

The catalog is a read-only resource. It must be listed by authenticated users
of either role, and it must not be writable over the API in this phase.

---

## 4. Security Requirements

- The backend remains the only authority on what a student may submit.
  Frontend validation is a UX convenience, not a boundary.
- The student identity must come from the authenticated request context.
- `projectId` must be validated against the catalog server-side. A client
  that posts an unknown or inactive id must be rejected.
- The catalog must not accept a `projectName` from the client, so the display
  name can never be spoofed.
- A student must not be able to resubmit another student's submission. A
  submission that does not belong to the caller must be reported as `404`,
  not `403`, so the endpoint does not confirm that another student's row
  exists.
- The submission rate limiter must apply to resubmissions as well as to
  first submissions.
- The rate limiter must not be keyed solely on the IP address. A cohort
  behind a shared address would otherwise exhaust a shared budget. It must
  key on the authenticated user when one is present.
- The catalog listing must not expose anything beyond the entry's public
  fields.

---

## 5. Validation Requirements

### 5.1 Backend (authoritative)

| Field | Rule |
| --- | --- |
| `projectId` | Required, non-empty, must exist in the catalog and be active |
| `repoUrl` | Required, valid URL, `http:`/`https:`, hostname `github.com` or `www.github.com`, max 150 characters |
| `liveUrl` | Required, valid URL, `http:`/`https:`, max 150 characters |
| `description` | Required, non-empty after trimming, max 5000 characters |

The same rules must apply to the create body and the resubmit body. The
rules must not drift between the two.

### 5.2 Frontend

The frontend must mirror the backend schema with the same Zod version, rules
and messages, so the browser never accepts data the API would reject.

---

## 6. UI Requirements

- The student dashboard must remain usable at mobile, tablet and desktop
  widths.
- A submission must be identified by its project and status, not by position
  in a list.
- Status must not be communicated by color alone.
- The picker's trigger must be keyboard reachable and clearly labelled.
- The resubmission dialog must be dismissible without losing the reason the
  student opened it.
- The mentor table must not lose its existing columns; the project code and
  the attempt chip are additions.

---

## 7. Performance Requirements

- The catalog must be fetched once and reused, not refetched on every
  interaction with the picker.
- The catalog query must use a cache lifetime that reflects how static the
  catalog is.
- The dashboard must not issue a separate request per catalog entry.
- The student's own submissions must be fetched in one request, not one per
  project.

---

## 8. Accessibility Requirements

- The picker must expose the selected project to assistive technologies
  through the trigger's accessible name.
- Each catalog option must state its state — available, already submitted, or
  rejected — as text, not only as a colour.
- The resubmission form's fields must have labels and must be reachable in
  the tab order.
- Errors must be announced, using the project's existing `role="alert"`
  pattern.
- The attempt number must be conveyed as text, not only as a visual badge.

---

## 9. Compatibility Requirements

- Every existing endpoint that is not listed in §3.1 must keep its current
  behaviour and response shape.
- The optional `code` field must not change any existing error response.
- Existing submissions must be migrated rather than discarded.
- The Prisma seed must remain runnable on its own and must not require the
  catalog to be present first.

---

## 10. Completion Requirements

The implementation is considered complete only when:

```text
A student can pick a project from the catalog and submit it
A student cannot submit the same project twice
A student can submit several different projects
A rejected submission can be resubmitted
A pending or approved submission cannot be resubmitted
The attempt counter advances on every resubmission
The mentor table shows the project and the attempt
Existing submissions were migrated without data loss
```

Client-side-only enforcement does not satisfy these requirements — the
duplicate rule must hold at the database level.
