# Phase 11 — Mentor Submission List Backend Requirements

## 1. Objective

Provide a secure, server-driven submission listing API for mentors.

The API must support pagination, filtering, searching, and sorting through query parameters.

---

# 2. Endpoint Requirements

## FR-01 — Submission List Endpoint

The backend must expose:

```http
GET /api/submissions
```

---

## FR-02 — Authentication

The endpoint must require a valid authenticated user.

Unauthenticated requests must be rejected according to the project's authentication convention.

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

# 3. Query Parameter Requirements

The endpoint must support:

| Parameter   | Purpose                     | Required |
| ----------- | --------------------------- | -------- |
| `page`      | Current pagination page     | No       |
| `limit`     | Records per page            | No       |
| `status`    | Submission status filter    | No       |
| `search`    | Search submissions/students | No       |
| `sortBy`    | Sorting field               | No       |
| `sortOrder` | Sorting direction           | No       |

Recommended defaults:

```text
page=1
limit=10
sortBy=createdAt
sortOrder=desc
```

---

# 4. Pagination Requirements

## FR-04 — Page

`page` must represent a positive integer.

Example:

```http
?page=2
```

---

## FR-05 — Limit

`limit` must represent a positive integer.

Example:

```http
?limit=20
```

A reasonable maximum limit should be enforced to prevent unnecessarily expensive database requests.

Recommended maximum:

```text
100
```

unless the project defines another limit.

---

## FR-06 — Skip Calculation

Pagination must use:

```ts
skip = (page - 1) * limit;
```

---

## FR-07 — Take

The normalized `limit` must be passed to Prisma as:

```ts
take;
```

---

## FR-08 — Pagination Response

The response must contain:

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

---

## FR-09 — Total

`pagination.total` must represent all records matching the active search and status filters before pagination is applied.

---

## FR-10 — Total Pages

Calculate:

```ts
totalPages = Math.ceil(total / limit);
```

For zero results:

```text
total = 0
totalPages = 0
```

---

# 5. Status Filtering Requirements

## FR-11 — Supported Statuses

The API must support:

```text
PENDING
APPROVED
REJECTED
```

---

## FR-12 — No Status Filter

When `status` is omitted, submissions from all statuses must be eligible for inclusion.

---

## FR-13 — Status and Pagination

Filtering must occur before pagination.

The following:

```http
GET /api/submissions?status=PENDING&page=2&limit=10
```

must represent page 2 of the filtered `PENDING` result set.

---

# 6. Search Requirements

## FR-14 — Search Parameter

The endpoint must support:

```text
search
```

---

## FR-15 — Project Name Search

Search must match submission project names.

---

## FR-16 — Student Name Search

Search must match student names through the appropriate student/user relationship.

---

## FR-17 — Student Email Search

Search must match student email addresses.

---

## FR-18 — Search Logic

The searchable fields must use OR semantics:

```text
projectName matches
OR
student.name matches
OR
student.email matches
```

---

## FR-19 — Search + Status

Search and status must use AND semantics relative to each other.

Conceptually:

```text
status = PENDING
AND
(
  projectName matches search
  OR student.name matches search
  OR student.email matches search
)
```

---

## FR-20 — Empty Search

An omitted or whitespace-only search value must not unnecessarily filter the results.

---

# 7. Sorting Requirements

## FR-21 — Sorting Fields

Only these fields may be used for `sortBy`:

```text
createdAt
projectName
status
```

---

## FR-22 — Sort Order

Supported directions:

```text
asc
desc
```

---

## FR-23 — Sorting Whitelist

Client-provided `sortBy` values must be validated against an explicit whitelist.

Arbitrary database fields must not be accepted.

---

## FR-24 — Sorting Before Pagination

The database must sort the complete filtered result set before applying `skip` and `take`.

---

# 8. Response Data Requirements

Each submission in `data` must provide the information required by the mentor submission table.

At minimum, the response should provide the relevant:

```text
submission ID
project name
status
created/submitted timestamp
student name
student email
```

Repository URL, live URL, description, and other existing submission properties may be returned when needed by the mentor workflow.

Sensitive user information must not be exposed.

---

# 9. Database Requirements

## DR-01 — Prisma Pagination

Use:

```ts
skip;
take;
```

for server-side pagination.

---

## DR-02 — Filtered Count

The count query and submission query must use equivalent filtering conditions.

Conceptually:

```ts
const where = buildWhere(...);

findMany({
  where,
  skip,
  take,
});

count({
  where,
});
```

---

## DR-03 — Related Student Data

Student name and email must be retrieved through the appropriate Prisma relation.

Only fields required by the API should be selected.

---

# 10. Security Requirements

## SR-01 — Backend Authorization

Authorization must be enforced on the backend.

Frontend route protection must not be considered sufficient.

---

## SR-02 — Query Validation

Raw client input must not be blindly passed into Prisma query construction.

Validate:

```text
page
limit
status
sortBy
sortOrder
```

and normalize:

```text
search
```

before database usage.

---

## SR-03 — Sorting Protection

Arbitrary sorting fields must not be accepted.

---

## SR-04 — Sensitive Data

The mentor list endpoint must not accidentally expose fields such as:

```text
passwordHash
authentication tokens
internal security metadata
```

---

# 11. Performance Requirements

## NFR-01 — Server-Side Operations

Pagination, filtering, searching, and sorting must occur on the backend/database.

The API must not retrieve every submission and then perform table operations in application memory.

---

## NFR-02 — Parallel Queries

The data and count queries should be executed concurrently where practical.

Example:

```ts
const [data, total] = await Promise.all([getSubmissions(), countSubmissions()]);
```

---

## NFR-03 — Pagination Limit

The API should enforce a maximum `limit` to prevent clients from requesting excessively large result sets.

---

# 12. Type Safety Requirements

Use explicit types for:

```ts
type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

type SubmissionSortField = "createdAt" | "projectName" | "status";

type SortOrder = "asc" | "desc";
```

Avoid unnecessary:

```ts
any;
```

---

# 13. Acceptance Criteria

Phase 11 is accepted when this request:

```http
GET /api/submissions?page=2&limit=10&status=PENDING&search=john&sortBy=createdAt&sortOrder=desc
```

correctly performs:

```text
Authentication
      ↓
MENTOR authorization
      ↓
status = PENDING
      ↓
search project/student
      ↓
sort createdAt DESC
      ↓
skip = 10
take = 10
      ↓
return data + pagination
```

All table operations must be represented by query parameters and executed server-side.
