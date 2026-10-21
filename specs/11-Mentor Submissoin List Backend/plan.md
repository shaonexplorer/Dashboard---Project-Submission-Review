# Phase 11 — Mentor Submission List Backend

## 1. Objective

Build the backend API used by mentors to retrieve and manage the submission list.

Implement:

```http
GET /api/submissions
```

The endpoint must support server-side:

- Pagination
- Status filtering
- Search
- Sorting

Only authenticated users with the `MENTOR` role may access this endpoint.

All table operations must be controlled through URL query parameters.

---

## 2. Endpoint

```http
GET /api/submissions
```

Required role:

```text
MENTOR
```

Supported query parameters:

```text
page
limit
status
search
sortBy
sortOrder
```

Example:

```http
GET /api/submissions?page=2&limit=10&status=PENDING&search=dashboard&sortBy=createdAt&sortOrder=desc
```

---

## 3. Backend Implementation Plan

### Step 1 — Register Mentor Submission Route

Add:

```http
GET /api/submissions
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

### Step 2 — Define Query Parameter Contract

Support:

```ts
page;
limit;
status;
search;
sortBy;
sortOrder;
```

Recommended defaults:

```ts
page = 1;
limit = 10;
sortBy = "createdAt";
sortOrder = "desc";
```

`status` and `search` should remain optional.

The exact default values should remain consistent across controller, service, validation, and API documentation.

---

### Step 3 — Validate Pagination

Parse:

```text
page
limit
```

as positive integers.

Calculate:

```ts
skip = (page - 1) * limit;
take = limit;
```

Example:

```text
page = 1
limit = 10

skip = 0
take = 10
```

For:

```text
page = 3
limit = 10
```

use:

```text
skip = 20
take = 10
```

Use Prisma's `skip` and `take` capabilities.

---

### Step 4 — Validate Status Filter

Supported status values:

```text
PENDING
APPROVED
REJECTED
```

When a valid status is supplied, add it to the Prisma `where` condition.

Conceptually:

```ts
where.status = status;
```

When no status is supplied, return submissions across all statuses.

Invalid status values must not be passed directly to Prisma.

---

### Step 5 — Implement Search

The `search` query parameter must search across:

- Project name
- Student name
- Student email

Build the Prisma filter using an `OR` condition.

Conceptually:

```ts
where.OR = [
  {
    projectName: {
      contains: search,
      mode: "insensitive",
    },
  },
  {
    student: {
      name: {
        contains: search,
        mode: "insensitive",
      },
    },
  },
  {
    student: {
      email: {
        contains: search,
        mode: "insensitive",
      },
    },
  },
];
```

Adapt relationship/property names to the actual Prisma schema.

Trim the search value before constructing the query.

An empty search value should behave as if no search filter was provided.

---

### Step 6 — Combine Search and Status

Search and status filtering must work simultaneously.

Example:

```http
GET /api/submissions?status=PENDING&search=portfolio
```

must return only submissions that:

```text
status = PENDING
AND
(
  projectName matches "portfolio"
  OR student name matches "portfolio"
  OR student email matches "portfolio"
)
```

Do not implement search and status as mutually exclusive filters.

---

### Step 7 — Implement Sorting

Supported `sortBy` values:

```text
createdAt
projectName
status
```

Supported `sortOrder` values:

```text
asc
desc
```

Create an explicit whitelist.

Conceptually:

```ts
const allowedSortFields = ["createdAt", "projectName", "status"] as const;
```

Do not pass arbitrary client-provided field names directly to Prisma.

Build:

```ts
orderBy: {
  [sortBy]: sortOrder,
}
```

only after validating both values.

---

### Step 8 — Retrieve Submissions

Query the database using:

```ts
prisma.submission.findMany({
  where,
  skip,
  take,
  orderBy,
  include: {
    student: true,
  },
});
```

The exact relation selection must match the existing Prisma schema.

Prefer `select` over retrieving unnecessary student fields if the project already follows that pattern.

The mentor list should include enough information for the upcoming frontend table, including:

- Submission ID
- Project name
- Repository URL
- Live URL
- Description when required
- Status
- Submission/creation timestamp
- Student ID when appropriate
- Student name
- Student email

Do not expose sensitive student information.

---

### Step 9 — Count Filtered Results

The pagination `total` must represent the total number of submissions matching the current filters, not simply the total number of submissions in the database.

Use the same `where` condition for:

```ts
prisma.submission.count({
  where,
});
```

and:

```ts
prisma.submission.findMany({
  where,
  ...
});
```

This ensures pagination metadata remains correct when filtering or searching.

---

### Step 10 — Run Data and Count Queries

Prefer executing the list query and count query together.

Conceptually:

```ts
const [data, total] = await Promise.all([
  prisma.submission.findMany(...),
  prisma.submission.count(...),
]);
```

This avoids unnecessary sequential database waiting.

---

### Step 11 — Calculate Pagination Metadata

Calculate:

```ts
totalPages = Math.ceil(total / limit);
```

Return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

`page` and `limit` must reflect the normalized values actually used by the query.

---

## 4. Query Construction Flow

The intended request flow is:

```text
GET /api/submissions
        ↓
Authentication
        ↓
MENTOR authorization
        ↓
Parse query parameters
        ↓
Validate/normalize parameters
        ↓
Build Prisma where condition
        ↓
Build Prisma orderBy
        ↓
Calculate skip/take
        ↓
findMany + count
        ↓
Calculate totalPages
        ↓
Return response
```

---

## 5. Recommended Query Object

After validation, normalize the query parameters into an internal structure such as:

```ts
interface SubmissionListQuery {
  page: number;
  limit: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  search?: string;
  sortBy: "createdAt" | "projectName" | "status";
  sortOrder: "asc" | "desc";
}
```

This prevents controllers/services from repeatedly parsing raw query strings.

---

## 6. Example Requests

Default list:

```http
GET /api/submissions
```

Pagination:

```http
GET /api/submissions?page=2&limit=20
```

Status filter:

```http
GET /api/submissions?status=PENDING
```

Search:

```http
GET /api/submissions?search=john
```

Sorting:

```http
GET /api/submissions?sortBy=projectName&sortOrder=asc
```

Combined:

```http
GET /api/submissions?page=2&limit=10&status=APPROVED&search=john&sortBy=createdAt&sortOrder=desc
```

---

## 7. Recommended Implementation Order

1. Inspect the existing submission Prisma model.
2. Inspect student/user relationships.
3. Inspect existing authentication middleware.
4. Inspect existing RBAC middleware.
5. Define query validation schema.
6. Add `GET /api/submissions`.
7. Restrict endpoint to `MENTOR`.
8. Parse and normalize query parameters.
9. Implement pagination.
10. Implement status filtering.
11. Implement project-name search.
12. Implement student-name search.
13. Implement student-email search.
14. Implement sorting whitelist.
15. Combine all filters.
16. Implement filtered count query.
17. Calculate pagination metadata.
18. Return normalized response.
19. Add automated tests.
20. Run lint and TypeScript checks.

---

## 8. Definition of Done

Phase 11 is complete when:

- `GET /api/submissions` exists.
- Authentication is required.
- Only `MENTOR` can access the endpoint.
- `page` works.
- `limit` works.
- Prisma `skip` and `take` are used.
- `status` filtering works.
- `PENDING` works.
- `APPROVED` works.
- `REJECTED` works.
- Search by project name works.
- Search by student name works.
- Search by student email works.
- Search and status filtering work together.
- `createdAt` sorting works.
- `projectName` sorting works.
- `status` sorting works.
- Ascending sorting works.
- Descending sorting works.
- Arbitrary sorting fields are rejected or safely normalized.
- Pagination metadata reflects filtered results.
- All operations work through query parameters.
- TypeScript checks pass.
- Relevant tests pass.
