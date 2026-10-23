# Phase 00 — Prevent Duplicate Submission Validation Specification

## 1. Purpose

This document defines the validation rules and the verification scenarios for
the project-catalog and duplicate-prevention feature.

The primary requirement is to verify that:

```text
A student may hold exactly one submission per catalog project
A student may hold submissions for several different projects
A rejected submission may be handed in again
```

and that all three rules are enforced by the backend and the database — never
by the client alone.

---

## 2. Catalog Validation

### VAL-01 — Catalog Listing

**Given**

An authenticated user of either role.

**When**

The user requests:

```text
GET /api/projects
```

**Then**

The response must be `200` and must contain every catalog entry with
`isActive = true`.

Entries with `isActive = false` must not be returned.

---

### VAL-02 — Catalog Authentication

**Given**

A request with no valid session.

**When**

The user requests:

```text
GET /api/projects
```

**Then**

The response must be `401`.

The catalog must not be readable anonymously.

---

### VAL-03 — Catalog Ordering

**Given**

The catalog contains more than one entry.

**When**

The list is returned.

**Then**

The entries must be ordered by name, ascending, and the order must be
identical across repeated requests.

---

### VAL-04 — Catalog Is Read-Only

**Given**

An authenticated `MENTOR`.

**When**

The mentor attempts to create, update or delete a catalog entry through any
endpoint.

**Then**

The request must be refused. No write path for the catalog may exist in this
phase.

---

### VAL-05 — Seed Idempotency

**Given**

The database has already been seeded with the catalog.

**When**

The seed is run a second time.

**Then**

- The catalog must not gain duplicate entries.
- An entry whose name or description changed in the seed file must be updated
  in the database.
- A catalog entry that is no longer in the seed file must **not** be deleted
  from the database.

---

## 3. Submission Creation Validation

### VAL-06 — Submission With a Catalog Project

**Given**

An authenticated `STUDENT` and an active catalog entry `ph-01`.

**When**

The student submits:

```json
{
  "projectId": "ph-01",
  "repoUrl": "https://github.com/student/task-orchestrator",
  "liveUrl": "https://task-orchestrator.vercel.app",
  "description": "Distributed job scheduler."
}
```

**Then**

- The response must be `201`.
- The stored submission must reference `projectId = "ph-01"`.
- The stored `projectName` must equal the catalog name, taken from the
  server's catalog — never from the request.
- The submission must start at `status = "PENDING"` and `attempt = 1`.

---

### VAL-07 — Free-Text Project Name Is Refused

**Given**

An authenticated `STUDENT`.

**When**

The student submits a body that carries `projectName` and no `projectId`.

**Then**

The response must be `400`, with a field error on `projectId`.

The endpoint must not accept a client-supplied project name.

---

### VAL-08 — Unknown Project

**Given**

An authenticated `STUDENT`.

**When**

The student submits `projectId = "does-not-exist"`.

**Then**

The response must be `400` with a field error on `projectId`.

No submission may be created.

---

### VAL-09 — Inactive Project

**Given**

A catalog entry with `isActive = false`.

**When**

The student submits that `projectId`.

**Then**

The response must be `400` with a field error on `projectId`.

An entry retired from the catalog must not be assignable, even though its
submissions remain intact.

---

### VAL-10 — Existing URL Rules Still Apply

**Given**

An authenticated `STUDENT`.

**When**

The student submits a body with a non-GitHub repository URL, a non-HTTP(S)
live URL, an empty description, or a description over 5000 characters.

**Then**

Each case must be rejected with `400` and a field error on the offending
field.

The catalog must not weaken any of the existing submission rules.

---

### VAL-11 — Mentor Cannot Submit

**Given**

An authenticated `MENTOR`.

**When**

The mentor calls `POST /api/submissions`.

**Then**

The response must be `403`.

---

## 4. Duplicate Prevention Validation

### VAL-12 — Same Project Twice

**Given**

A `STUDENT` who already has a `PENDING` submission for `ph-01`.

**When**

The student submits `projectId = "ph-01"` again.

**Then**

- The response must be `409`.
- The response must carry `code = "DUPLICATE_SUBMISSION"`.
- The number of submissions the student holds for `ph-01` must still be `1`.

---

### VAL-13 — Approved Project Cannot Be Resubmitted as New

**Given**

A `STUDENT` who already has an `APPROVED` submission for `ph-01`.

**When**

The student submits `projectId = "ph-01"` again.

**Then**

The response must be `409` with `code = "DUPLICATE_SUBMISSION"`.

---

### VAL-14 — Rejected Project Requires Resubmission, Not Creation

**Given**

A `STUDENT` who already has a `REJECTED` submission for `ph-01`.

**When**

The student submits `projectId = "ph-01"` again.

**Then**

- The response must be `409`.
- The response must carry `code = "RESUBMIT_REQUIRED"` — distinct from
  `DUPLICATE_SUBMISSION`.
- No second row may be created.

The client must be able to tell these two cases apart from the `code` alone,
without reading the message.

---

### VAL-15 — Different Projects Are Allowed

**Given**

A `STUDENT` who already has a `PENDING` submission for `ph-01`.

**When**

The student submits `projectId = "ph-04"`.

**Then**

The response must be `201`, and the student must now hold two submissions.

The rule is per project, not per student.

---

### VAL-16 — Two Students May Submit the Same Project

**Given**

Two different students.

**When**

Both submit `projectId = "ph-01"`.

**Then**

Both must succeed with `201`.

The constraint is scoped to the student, not to the project.

---

### VAL-17 — Database-Level Enforcement

**Given**

Two concurrent requests from the same student for the same `projectId`,
submitted so that both pass the application-level duplicate check.

**When**

Both are processed.

**Then**

- Exactly one must succeed with `201`.
- The other must fail with `409`.
- The database must contain exactly one submission for that
  `(studentId, projectId)` pair.

Verify directly against the database:

```sql
SELECT studentId, projectId, COUNT(*)
FROM "Submission"
GROUP BY studentId, projectId
HAVING COUNT(*) > 1;
```

This query must return zero rows. It is the authoritative check for the
feature — the application-level check is a convenience, the unique index is
the rule.

---

### VAL-18 — Unique Index Exists

Verify in the database that the unique constraint on
`(studentId, projectId)` exists, and that the old single-column unique
constraint on `studentId` no longer exists.

---

## 5. Resubmission Validation

### VAL-19 — Resubmit a Rejected Submission

**Given**

A `STUDENT` who owns a `REJECTED` submission with `attempt = 1`.

**When**

The student calls:

```text
PUT /api/submissions/:id/resubmit
```

with a valid body.

**Then**

- The response must be `200`.
- `status` must be `PENDING`.
- `attempt` must be `2`.
- `resubmittedAt` must be set.
- `repoUrl`, `liveUrl` and `description` must hold the submitted values.
- `projectId` and `projectName` must be unchanged.
- `feedback` must be retained.
- The number of rows for that `(studentId, projectId)` must still be `1`.

---

### VAL-20 — Resubmission Never Creates a Row

**Given**

A `STUDENT` who has resubmitted once.

**When**

The student resubmits again after a second rejection.

**Then**

`attempt` must be `3`, and the row count for that
`(studentId, projectId)` must still be `1`.

---

### VAL-21 — Pending Submission Cannot Be Resubmitted

**Given**

A `PENDING` submission.

**When**

The student calls the resubmit endpoint.

**Then**

The response must be `409` with `code = "NOT_RESUBMITTABLE"`.

---

### VAL-22 — Approved Submission Cannot Be Resubmitted

**Given**

An `APPROVED` submission.

**When**

The student calls the resubmit endpoint.

**Then**

The response must be `409` with `code = "NOT_RESUBMITTABLE"`.

---

### VAL-23 — Resubmitting Another Student's Submission

**Given**

A submission owned by student A.

**When**

Student B calls the resubmit endpoint with that submission's id.

**Then**

The response must be `404`.

It must not be `403` — a `403` would confirm that another student's
submission exists.

---

### VAL-24 — Resubmit an Unknown Submission

**Given**

A syntactically valid but non-existent submission id.

**When**

The student calls the resubmit endpoint.

**Then**

The response must be `404`.

---

### VAL-25 — Resubmit Validation Rules

**Given**

A `STUDENT` owning a `REJECTED` submission.

**When**

The student calls the resubmit endpoint with a non-GitHub repository URL, a
malformed live URL, or an empty description.

**Then**

Each case must be rejected with `400` and a field error on the offending
field — the same rules the create endpoint enforces.

---

### VAL-26 — Resubmit Cannot Change the Project

**Given**

A `REJECTED` submission for `ph-01`.

**When**

The student calls the resubmit endpoint with a body containing
`projectId = "ph-04"`.

**Then**

The project must not change. The submission must still reference `ph-01`.

A project change is a different operation and is not part of this phase.

---

### VAL-27 — Resubmission Is Rate Limited

**Given**

The submission rate limit for the caller has been exhausted.

**When**

The student calls the resubmit endpoint.

**Then**

The response must be `429`.

A resubmission is a submission attempt and must be limited like one.

---

## 6. Student Listing Validation

### VAL-28 — Listing Own Submissions

**Given**

A `STUDENT` with three submissions for three different projects.

**When**

The student calls `GET /api/submissions/me`.

**Then**

- The response must be `200`.
- The response must contain all three submissions.
- The most recent submission must appear first.
- Every entry must carry `projectId`, `attempt` and `resubmittedAt`.

---

### VAL-29 — Empty Listing

**Given**

A `STUDENT` who has submitted nothing.

**When**

The student calls `GET /api/submissions/me`.

**Then**

The response must be `200` with an **empty array**.

It must not be `404`. "Nothing submitted yet" is a normal state, and the
dashboard renders an empty state from it.

---

### VAL-30 — Listing Is Scoped To The Caller

**Given**

Two students, each with submissions.

**When**

Student A calls `GET /api/submissions/me`.

**Then**

Only student A's submissions may be returned.

---

### VAL-31 — Mentor Cannot List Student Submissions

**Given**

An authenticated `MENTOR`.

**When**

The mentor calls `GET /api/submissions/me`.

**Then**

The response must be `403`.

---

## 7. Migration Validation

### VAL-32 — Existing Submissions Survive

**Given**

A database that already contains submissions from an earlier phase, before
this feature.

**When**

The migration is applied.

**Then**

- No submission may be deleted.
- Every submission must have a non-null `projectId`.
- Every submission must point at the seeded legacy catalog entry.
- Every submission must have `attempt = 1`.

Verify:

```sql
SELECT COUNT(*) FROM "Submission" WHERE "projectId" IS NULL;
```

must return `0`.

---

### VAL-33 — Migration Is Re-runnable

**Given**

The migration has already been applied.

**When**

The migration is applied again (as a fresh database, e.g. a CI run from
scratch).

**Then**

It must complete without error and produce the same schema.

---

### VAL-34 — Catalog Seed After Migration

**Given**

A migrated database.

**When**

The seed is run.

**Then**

- The legacy catalog entry must exist.
- The seed must not fail because the legacy entry is already present.

---

## 8. Mentor Dashboard Validation

### VAL-35 — Project and Attempt Are Visible

**Given**

A mentor viewing the submission table.

**Then**

Each row must show the project name and its catalog code, and a row whose
`attempt` is greater than `1` must be distinguishable from a first attempt.

---

### VAL-36 — Search Still Matches the Project Name

**Given**

A mentor searching for a project name.

**Then**

The search must still be executed by the database against the project name,
and must return matching rows.

---

### VAL-37 — Sorting Still Works

**Given**

A mentor sorting by project name or by submission date.

**Then**

The sort must still be applied by the database and the returned order must
match the requested order.

---

### VAL-38 — Reviewing a Resubmission

**Given**

A `PENDING` submission with `attempt = 2`.

**When**

A mentor records a review decision.

**Then**

- `status`, `feedback`, `reviewedAt` and `reviewedById` must be updated.
- `attempt` must stay `2`.
- The new `feedback` must replace the feedback retained from the previous
  attempt.

---

## 9. Student Interface Validation

### VAL-39 — The Picker Is Populated From the Server

**Given**

The student opens the submission form.

**Then**

The project options must come from `GET /api/projects`.

A catalog entry added to the database must appear in the picker without a
client change. A hard-coded client-side list fails this check.

---

### VAL-40 — The Picker Shows the Selected Project

**Given**

The student selects a project.

**Then**

- The selected project's name and code must be visible in the control.
- The submitted request body must contain that project's `projectId`.
- The request body must not contain a free-text project name.

---

### VAL-41 — Already-Submitted Projects Are Identified

**Given**

The student already has a submission for `ph-01`.

**Then**

`ph-01` must be identified as already submitted in the picker, and the
student must be offered the resubmission path for it rather than a fresh
submission.

The client-side marking is a convenience — the server must still refuse the
duplicate (VAL-12).

---

### VAL-42 — Multiple Submissions Are Listed

**Given**

A student with three submissions.

**Then**

The dashboard must show all three, each with its own status, attempt number
and links.

The student must be able to start a fourth, different submission without the
existing ones disappearing.

---

### VAL-43 — Resubmission Is Offered Only When Rejected

**Given**

A submission with `status = "REJECTED"`.

**Then**

A resubmission action must be available.

**Given**

A submission with `status = "PENDING"` or `"APPROVED"`.

**Then**

No resubmission action may be offered, and the submission must not be
editable.

---

### VAL-44 — Feedback Stays Visible During Resubmission

**Given**

A rejected submission with mentor feedback.

**Then**

The feedback must remain visible when the resubmission form is open, and it
must be labelled as belonging to the previous attempt.

---

### VAL-45 — Attempt Number Is Displayed

**Given**

A submission with `attempt = 2`.

**Then**

The attempt number must be visible in the student interface.

---

### VAL-46 — Empty State

**Given**

A student with no submissions.

**Then**

The dashboard must render an empty state and the submission form must be
available. The dashboard must not render a blank screen or an error.

---

### VAL-47 — Duplicate Attempt Feedback

**Given**

A student who submits a project they have already submitted.

**Then**

- The interface must show a clear message.
- For `DUPLICATE_SUBMISSION`, the message must explain that the project is
  already in review and must not offer a resubmission action.
- For `RESUBMIT_REQUIRED`, the interface must point at the existing
  submission's resubmission action.
- The interface must reach that decision from the `code`, not from the
  message text.

---

### VAL-48 — Error Handling

Simulate a failed catalog request, a failed create request and a failed
resubmit request.

Verify:

- The dashboard does not crash.
- An error message is shown.
- Partial or invalid response data is not rendered as valid data.
- Retry is available where appropriate.
- A failed resubmission does not leave the submission displayed as
  resubmitted.

---

## 10. Loading and Error State Validation

### VAL-49 — Catalog Loading State

While `GET /api/projects` is in flight, the picker must show a loading state
rather than an empty control that looks like an empty catalog.

---

### VAL-50 — Catalog Failure State

When `GET /api/projects` fails, the picker must show an error and a retry
affordance. The student must not be able to submit a submission with an empty
`projectId` and be told only that the project is required.

---

## 11. Accessibility Validation

### VAL-51 — Picker Keyboard Operation

The picker must be operable with the keyboard alone: the trigger must be
focusable, must open on Enter and Space, and the option list must be
reachable and selectable without a pointer.

---

### VAL-52 — Selected Project Is Announced

The picker's trigger must expose the selected project through its accessible
name, so a screen-reader user can tell which project is selected without
opening the list.

---

### VAL-53 — Option State Is Not Color-Only

Each option's state — available, already submitted, rejected — must be
communicated as text. Color alone fails this check.

---

### VAL-54 — Attempt Number Is Not Color-Only

The attempt badge must include readable text such as "Attempt 2".

---

### VAL-55 — Errors Are Announced

Submission and resubmission errors must be announced through the project's
existing `role="alert"` pattern.

---

## 12. Security Validation

### VAL-56 — The Client Cannot Forge a Project Name

**Given**

A student who crafts a request body containing `projectName: "Anything"`.

**When**

The request is sent.

**Then**

The stored `projectName` must equal the catalog name for the submitted
`projectId`. The client-supplied name must never be persisted.

---

### VAL-57 — The Client Cannot Escalate Its Own Submissions

**Given**

A student who crafts a request body containing `studentId`, `status` or
`attempt`.

**Then**

None of those fields may be honoured. The student identity comes from the
session, the status starts at `PENDING`, and the attempt starts at `1`.

---

### VAL-58 — Backend Authorization Is Enforced Independently

Verify that each protected endpoint rejects an unauthenticated request, and
that a `STUDENT` cannot reach a `MENTOR` endpoint and a `MENTOR` cannot reach
a `STUDENT` endpoint — regardless of what the frontend does.

---

### VAL-59 — Rate Limiting Is Per User

**Given**

Two students behind the same IP address.

**When**

One of them exhausts the submission rate limit.

**Then**

The other student must still be able to submit.

This fails if the limiter is keyed on the IP alone.

---

## 13. Migration and Compatibility Regression

### VAL-60 — Existing Endpoints Are Unchanged

The following must behave exactly as they did before this phase:

```text
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me
GET    /api/submissions          (mentor list — same query parameters, same pagination envelope)
PATCH  /api/submissions/:id/status
```

The mentor list response gains `projectId` and `attempt`; every other field
and the pagination envelope must be unchanged.

---

### VAL-61 — Existing Error Responses Are Unchanged

Verify that an error response without a `code` is byte-for-byte the same as
before:

```json
{
  "success": false,
  "message": "Submission not found"
}
```

The `code` field must be optional and absent unless explicitly set.

---

## 14. Final Validation Checklist

- [ ] `GET /api/projects` returns the seeded catalog.
- [ ] Unauthenticated catalog access returns `401`.
- [ ] Inactive catalog entries are not returned.
- [ ] The seed is idempotent and does not delete entries.
- [ ] A submission accepts `projectId` and no longer accepts `projectName`.
- [ ] An unknown `projectId` returns `400`.
- [ ] An inactive `projectId` returns `400`.
- [ ] The same project submitted twice returns `409`.
- [ ] `DUPLICATE_SUBMISSION` and `RESUBMIT_REQUIRED` are distinguishable.
- [ ] A different project for the same student succeeds.
- [ ] Two students can submit the same project.
- [ ] Concurrent duplicate creates leave exactly one row.
- [ ] The `(studentId, projectId)` unique index exists.
- [ ] The old `studentId` unique constraint is gone.
- [ ] A rejected submission can be resubmitted.
- [ ] A resubmission increments `attempt` and returns to `PENDING`.
- [ ] A resubmission retains the previous feedback.
- [ ] A resubmission never creates a second row.
- [ ] A pending submission cannot be resubmitted.
- [ ] An approved submission cannot be resubmitted.
- [ ] Another student's submission returns `404` on resubmit.
- [ ] A resubmission cannot change the project.
- [ ] Resubmissions are rate limited.
- [ ] `GET /api/submissions/me` returns a list.
- [ ] An empty list returns `200` with `[]`.
- [ ] The mentor list is scoped to the caller.
- [ ] Existing submissions were migrated with a non-null `projectId`.
- [ ] The mentor table shows the project code and the attempt.
- [ ] Mentor search and sorting still work.
- [ ] The picker is populated from the server.
- [ ] Already-submitted projects are identified in the picker.
- [ ] The dashboard lists every submission.
- [ ] The resubmission action appears only for rejected submissions.
- [ ] The attempt number is visible.
- [ ] The empty state renders.
- [ ] The picker is keyboard operable.
- [ ] Option state and attempt number are conveyed as text.
- [ ] Rate limiting is per user, not per IP.
- [ ] Existing endpoints and error responses are unchanged.

## 15. Definition of Done

This phase is validated when a student can pick a project from the catalog,
hand it in, be unable to hand in the same project twice, hand in a different
project, and — after a rejection — hand the same project in again, with every
one of those rules enforced by the backend and the database rather than by
the client.

The authoritative check for the duplicate rule is the database itself:

```sql
SELECT studentId, projectId, COUNT(*)
FROM "Submission"
GROUP BY studentId, projectId
HAVING COUNT(*) > 1;
```

This query must return zero rows, and the unique index behind it must exist
in the schema.
