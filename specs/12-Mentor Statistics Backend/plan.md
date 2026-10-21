# Phase 12 — Mentor Statistics Backend

## 1. Objective

Build the backend endpoint that supplies the mentor dashboard's statistics cards.

Implement:

```http
GET /api/submissions/stats
```

The endpoint must return aggregate counts computed by the database:

```text
total
pending
approved
rejected
```

Only authenticated users with the `MENTOR` role may access this endpoint.

---

## 2. Endpoint

```http
GET /api/submissions/stats
```

Required role:

```text
MENTOR
```

No query parameters. The statistics always describe the full table.

Example response:

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

## 3. Backend Implementation Plan

### Step 1 — Register the Statistics Route

Add:

```http
GET /api/submissions/stats
```

to the existing submission router.

Protect the route using the project's existing:

1. Authentication middleware
2. Role authorization middleware

Only:

```text
MENTOR
```

must be allowed to access the endpoint.

Do not rely on frontend route protection for backend authorization.

---

### Step 2 — Register the Route Before Any Dynamic Segment

The route is a literal path and must be registered before any future
`/:id` route, so that `stats` is never interpreted as a submission
identifier.

Conceptually:

```ts
router.get("/me", ...);
router.get("/stats", ...); // literal path — must precede "/:id"
router.get("/", ...);
```

---

### Step 3 — Add the Statistics Service

Add a service function to the existing submission service module.

Conceptually:

```ts
export const getSubmissionStatsService = async (): Promise<SubmissionStats> => {
  const [total, groups] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  // map groups onto the pending / approved / rejected counts
};
```

Both queries run concurrently, so the endpoint waits for a single round of
database work rather than two sequential ones.

---

### Step 4 — Use Database Aggregation, Not Application Counting

The counts must come from database aggregation queries.

Allowed:

```ts
prisma.submission.count();
prisma.submission.groupBy({ by: ["status"], _count: { _all: true } });
```

Not allowed:

```ts
const submissions = await prisma.submission.findMany();
const pending = submissions.filter((s) => s.status === "PENDING").length;
```

The statistics must never be derived from a paginated result set, because a
paginated result describes one page of rows, not the table.

---

### Step 5 — Map the Groups onto the Response Shape

`groupBy` returns one row per status that is present in the table. A status
with no rows is simply absent from the result, so every count must start at
zero and be filled in as the groups are walked.

Conceptually:

```ts
const stats = { total, pending: 0, approved: 0, rejected: 0 };

for (const group of groups) {
  if (group.status === "PENDING") stats.pending = group._count._all;
  if (group.status === "APPROVED") stats.approved = group._count._all;
  if (group.status === "REJECTED") stats.rejected = group._count._all;
}
```

An empty table therefore returns all four counts as `0`, never `undefined`.

---

### Step 6 — Compute the Total Independently

`total` is read with a dedicated `count()` query rather than by summing the
three status counts, so the figure the dashboard shows as "Total submissions"
is an independent database reading of the table.

---

### Step 7 — Add the Controller

Add a controller that forwards to the service and sends the standard
response.

Conceptually:

```ts
export const getSubmissionStatsController = asyncHandler(async (_req, res) => {
  const stats = await getSubmissionStatsService();

  sendResponse(res, 200, "Submission statistics retrieved", stats);
});
```

The controller performs no counting of its own.

---

### Step 8 — Return the Response

The four counts are the payload of the standard response envelope:

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

## 4. Request Flow

The intended request flow is:

```text
GET /api/submissions/stats
        ↓
Authentication
        ↓
MENTOR authorization
        ↓
count() + groupBy()   (parallel)
        ↓
map groups onto counts
        ↓
Return response
```

---

## 5. Recommended Implementation Order

1. Inspect the existing submission service module.
2. Add the `SubmissionStats` type and the statistics service.
3. Add the statistics controller.
4. Register `GET /api/submissions/stats` before any dynamic route.
5. Run the TypeScript check.
6. Verify the endpoint against the local database.
7. Verify the role gate and the authentication gate.

---

## 6. Definition of Done

Phase 12 is complete when:

- `GET /api/submissions/stats` exists.
- Authentication is required.
- Only `MENTOR` can access the endpoint.
- `total` reflects every submission in the database.
- `pending`, `approved` and `rejected` reflect the matching rows.
- The counts come from database aggregation, not application-side counting.
- The counts are not derived from a paginated result set.
- An empty table returns four zeroes.
- The response follows the standard envelope.
- TypeScript checks pass.
