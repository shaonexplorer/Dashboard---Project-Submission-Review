# Phase 12 — Mentor Statistics Backend Requirements

## 1. Objective

Provide a secure, database-backed statistics API for the mentor dashboard.

The API must return aggregate counts of every submission, grouped by status.

---

# 2. Endpoint Requirements

## FR-01 — Statistics Endpoint

The backend must expose:

```http
GET /api/submissions/stats
```

---

## FR-02 — Authentication

The endpoint must require a valid authenticated user.

Unauthenticated requests must be rejected according to the project's
authentication convention.

Recommended:

```http
401 Unauthorized
```

---

## FR-03 — Mentor Authorization

Only users with:

```text
MENTOR
```

role may access the endpoint.

Authenticated users without the required role must be rejected.

Recommended:

```http
403 Forbidden
```

---

## FR-04 — Route Ordering

The statistics route is a literal path and must be registered before any
dynamic `/:id` route, so that `stats` is never read as a submission
identifier.

---

## FR-05 — No Query Parameters

The endpoint must not accept or require query parameters.

The statistics always describe the full table. Filtering and searching
belong to the submission list endpoint, not to the statistics endpoint.

---

# 3. Response Requirements

## FR-06 — Returned Counts

The response must contain:

```text
total
pending
approved
rejected
```

---

## FR-07 — Count Semantics

| Field      | Meaning                                          |
| ---------- | ------------------------------------------------ |
| `total`    | Every submission in the database                 |
| `pending`  | Every submission with status `PENDING`           |
| `approved` | Every submission with status `APPROVED`          |
| `rejected` | Every submission with status `REJECTED`          |

---

## FR-08 — Response Envelope

The response must follow the project's standard envelope:

```json
{
  "success": true,
  "message": "Submission statistics retrieved",
  "data": {
    "total": 120,
    "pending": 42,
    "approved": 63,
    "rejected": 15
  }
}
```

---

## FR-09 — Numeric Counts

Every count must be a number.

A status with no matching rows must be reported as `0`, never as `null`,
`undefined` or a missing key.

---

## FR-10 — Empty Table

Given a database with no submissions, the endpoint must return:

```json
{
  "success": true,
  "message": "Submission statistics retrieved",
  "data": {
    "total": 0,
    "pending": 0,
    "approved": 0,
    "rejected": 0
  }
}
```

---

# 4. Database Requirements

## DR-01 — Database Aggregation

The counts must be produced by database aggregation or count queries.

Allowed:

```ts
prisma.submission.count();
prisma.submission.groupBy({ by: ["status"], _count: { _all: true } });
```

---

## DR-02 — No Application-Side Counting

The implementation must not fetch rows and count them in application memory.

Not allowed:

```ts
const submissions = await prisma.submission.findMany();
const pending = submissions.filter((s) => s.status === "PENDING").length;
```

---

## DR-03 — Not Derived From Paginated Results

The statistics must not be calculated from the paginated list endpoint's
result set.

A paginated page describes one slice of rows, so the counts derived from it
would silently under-report the table.

---

## DR-04 — Status Groups

The per-status counts must come from a grouping over the stored `status`
column, so every status the database knows about is represented.

---

## DR-05 — Independent Total

`total` must be read with a dedicated count query rather than by summing the
per-status counts, so the figure is an independent reading of the table.

---

## DR-06 — Concurrent Queries

The total count and the status grouping should be executed concurrently.

Conceptually:

```ts
const [total, groups] = await Promise.all([
  prisma.submission.count(),
  prisma.submission.groupBy({ by: ["status"], _count: { _all: true } }),
]);
```

---

## DR-07 — No Row Fetching

The endpoint must not select submission rows. It returns counts only, so no
submission data — and no student data — needs to be read.

---

# 5. Security Requirements

## SR-01 — Backend Authorization

Authorization must be enforced on the backend.

Frontend route protection must not be considered sufficient.

---

## SR-02 — No Data Exposure

The endpoint returns aggregate counts only.

It must not expose:

```text
submission content
student identity
password hashes
authentication tokens
internal security metadata
```

---

# 6. Performance Requirements

## NFR-01 — Constant Query Count

The endpoint must issue a fixed, small number of aggregation queries
regardless of how many submissions exist.

It must not scale with the size of the table.

---

## NFR-02 — Parallel Queries

The count and grouping queries should be executed concurrently so the
endpoint does not wait for two sequential database round trips.

---

# 7. Type Safety Requirements

Use an explicit type for the statistics payload:

```ts
type SubmissionStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};
```

Avoid unnecessary:

```ts
any;
```

---

# 8. Acceptance Criteria

Phase 12 is accepted when this request:

```http
GET /api/submissions/stats
```

correctly performs:

```text
Authentication
      ↓
MENTOR authorization
      ↓
count() + groupBy()   (parallel)
      ↓
map groups onto counts
      ↓
return data: { total, pending, approved, rejected }
```

and the returned counts match the actual contents of the database.
