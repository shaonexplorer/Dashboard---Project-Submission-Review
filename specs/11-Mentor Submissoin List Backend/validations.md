# Phase 11 — Mentor Submission List Backend Validations

## 1. Purpose

Validate the behavior, security, pagination, filtering, searching, sorting, and response structure of:

```http
GET /api/submissions
```

---

# 2. Authentication & Authorization

## VAL-AUTH-01 — Unauthenticated Request

### Request

```http
GET /api/submissions
```

without valid authentication.

### Expected

```http
401 Unauthorized
```

or the project's standard authentication response.

---

## VAL-AUTH-02 — Mentor Access

Given an authenticated:

```text
MENTOR
```

request:

```http
GET /api/submissions
```

must succeed.

Expected:

```http
200 OK
```

---

## VAL-AUTH-03 — Student Access

Given an authenticated:

```text
STUDENT
```

request:

```http
GET /api/submissions
```

must be rejected.

Recommended:

```http
403 Forbidden
```

---

# 3. Pagination Validations

## VAL-PAGE-01 — Default Pagination

Request:

```http
GET /api/submissions
```

Verify the configured defaults are used.

Recommended:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

---

## VAL-PAGE-02 — Page 1

Request:

```http
GET /api/submissions?page=1&limit=10
```

Expected Prisma pagination:

```text
skip = 0
take = 10
```

---

## VAL-PAGE-03 — Page 2

Request:

```http
GET /api/submissions?page=2&limit=10
```

Expected:

```text
skip = 10
take = 10
```

---

## VAL-PAGE-04 — Page 5

Request:

```http
GET /api/submissions?page=5&limit=20
```

Expected:

```text
skip = 80
take = 20
```

---

## VAL-PAGE-05 — Total Pages

Given:

```text
total = 95
limit = 10
```

expected:

```text
totalPages = 10
```

---

## VAL-PAGE-06 — Zero Results

Given no matching records:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

---

## VAL-PAGE-07 — Invalid Page

Test values such as:

```text
page=0
page=-1
page=abc
page=1.5
```

The API must apply the project's query validation strategy.

Invalid values must never result in unsafe Prisma pagination values.

---

## VAL-PAGE-08 — Invalid Limit

Test:

```text
limit=0
limit=-5
limit=abc
limit=1.5
```

The API must reject or safely normalize invalid values according to the project's validation convention.

---

## VAL-PAGE-09 — Excessive Limit

Request:

```http
GET /api/submissions?limit=100000
```

Verify that the configured maximum is enforced.

The database must not be allowed to return an arbitrarily large result set.

---

# 4. Status Filtering

## VAL-STATUS-01 — Pending

Request:

```http
GET /api/submissions?status=PENDING
```

Every returned submission must have:

```text
status = PENDING
```

---

## VAL-STATUS-02 — Approved

Request:

```http
GET /api/submissions?status=APPROVED
```

Every returned submission must have:

```text
status = APPROVED
```

---

## VAL-STATUS-03 — Rejected

Request:

```http
GET /api/submissions?status=REJECTED
```

Every returned submission must have:

```text
status = REJECTED
```

---

## VAL-STATUS-04 — No Status

Request:

```http
GET /api/submissions
```

must not implicitly restrict results to one status unless such behavior is explicitly defined elsewhere.

---

## VAL-STATUS-05 — Invalid Status

Test:

```http
GET /api/submissions?status=INVALID
```

The value must not be passed directly to Prisma.

The API must reject or normalize it according to the project's query-validation convention.

---

# 5. Search Validations

## VAL-SEARCH-01 — Project Name

Given:

```text
projectName = Student Management System
```

request:

```http
GET /api/submissions?search=Student
```

must include the matching submission.

---

## VAL-SEARCH-02 — Student Name

Given a student:

```text
name = John Doe
```

request:

```http
GET /api/submissions?search=John
```

must include that student's submission.

---

## VAL-SEARCH-03 — Student Email

Given:

```text
email = john@example.com
```

request:

```http
GET /api/submissions?search=john@example.com
```

must include that student's submission.

---

## VAL-SEARCH-04 — Partial Search

Verify that partial matching works according to the defined search behavior.

Example:

```http
GET /api/submissions?search=manage
```

should match:

```text
Student Management System
```

---

## VAL-SEARCH-05 — Case Handling

When case-insensitive search is supported by the selected database/Prisma implementation, verify that:

```text
JOHN
john
John
```

produce equivalent relevant matches.

---

## VAL-SEARCH-06 — Empty Search

Request:

```http
GET /api/submissions?search=
```

must behave like an unfiltered search request.

---

## VAL-SEARCH-07 — Whitespace Search

Request conceptually containing:

```text
search="   "
```

must not create an unintended filter.

Trim the value before constructing the query.

---

# 6. Combined Filtering Validations

## VAL-COMBINE-01 — Status + Search

Request:

```http
GET /api/submissions?status=PENDING&search=john
```

Every result must:

```text
have status PENDING

AND

match "john" in:
- project name
- student name
- student email
```

---

## VAL-COMBINE-02 — Search + Pagination

Request:

```http
GET /api/submissions?search=portfolio&page=2&limit=10
```

must return page 2 of the searched result set, not page 2 of all submissions.

---

## VAL-COMBINE-03 — Status + Pagination

Request:

```http
GET /api/submissions?status=APPROVED&page=2&limit=10
```

must paginate only approved submissions.

---

# 7. Sorting Validations

## VAL-SORT-01 — createdAt Ascending

Request:

```http
GET /api/submissions?sortBy=createdAt&sortOrder=asc
```

Verify results are ordered from oldest to newest.

---

## VAL-SORT-02 — createdAt Descending

Request:

```http
GET /api/submissions?sortBy=createdAt&sortOrder=desc
```

Verify results are ordered from newest to oldest.

---

## VAL-SORT-03 — Project Name Ascending

Request:

```http
GET /api/submissions?sortBy=projectName&sortOrder=asc
```

Verify project names are ordered according to the database's defined string ordering.

---

## VAL-SORT-04 — Project Name Descending

Request:

```http
GET /api/submissions?sortBy=projectName&sortOrder=desc
```

Verify reverse ordering.

---

## VAL-SORT-05 — Status

Request:

```http
GET /api/submissions?sortBy=status&sortOrder=asc
```

Verify the database sorts according to the stored status representation.

Do not assume a custom business ordering such as:

```text
PENDING → APPROVED → REJECTED
```

unless explicitly implemented.

---

## VAL-SORT-06 — Invalid Sort Field

Request:

```http
GET /api/submissions?sortBy=passwordHash
```

must not cause Prisma to dynamically sort by the supplied field.

Only:

```text
createdAt
projectName
status
```

are valid.

---

## VAL-SORT-07 — Invalid Sort Order

Request:

```http
GET /api/submissions?sortOrder=random
```

must be rejected or normalized according to the project's validation strategy.

Only:

```text
asc
desc
```

are valid.

---

# 8. Combined Table Operation Validation

Test:

```http
GET /api/submissions?page=2&limit=10&status=PENDING&search=john&sortBy=createdAt&sortOrder=desc
```

Verify the logical execution:

```text
status filter
       ↓
search filter
       ↓
sort createdAt DESC
       ↓
skip 10
       ↓
take 10
```

The response must contain page 2 of the filtered, searched, and sorted dataset.

---

# 9. Pagination Metadata Validation

For every request verify:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Rules:

```text
page       = normalized requested page
limit      = normalized requested limit
total      = total matching records before pagination
totalPages = ceil(total / limit)
```

---

# 10. Count Consistency Validation

Given:

```http
GET /api/submissions?status=PENDING&search=john
```

both:

```ts
findMany();
```

and:

```ts
count();
```

must use equivalent `where` conditions.

Otherwise pagination metadata may represent a different dataset from `data`.

---

# 11. Response Validation

Verify the response follows:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Verify each returned submission contains the fields required by the mentor workflow.

Verify related student information contains only intended fields such as:

```text
id
name
email
```

when those fields are required.

Sensitive authentication fields must never be returned.

---

# 12. Security Validations

Verify the endpoint does not expose:

```text
password hashes
JWT values
refresh tokens
password reset tokens
internal authentication secrets
```

Verify arbitrary query input cannot control unapproved Prisma sorting fields.

Verify authentication and role authorization execute before submission data is returned.

---

# 13. Performance Validations

Verify pagination occurs at the database level using:

```ts
skip;
take;
```

Do not implement:

```ts
const submissions = await prisma.submission.findMany();

const paginated = submissions.slice(...);
```

for server-side pagination.

Search and status filtering must also be performed by the database query rather than filtering the complete result set in Node.js.

---

# 14. Manual API Test Matrix

| Request                             | Expected                        |
| ----------------------------------- | ------------------------------- |
| `/api/submissions`                  | Default paginated list          |
| `?page=2`                           | Page 2                          |
| `?limit=20`                         | 20 records maximum              |
| `?status=PENDING`                   | Pending only                    |
| `?status=APPROVED`                  | Approved only                   |
| `?status=REJECTED`                  | Rejected only                   |
| `?search=portfolio`                 | Matching submissions/students   |
| `?sortBy=createdAt&sortOrder=desc`  | Newest first                    |
| `?sortBy=projectName&sortOrder=asc` | Project-name ordering           |
| `?sortBy=status&sortOrder=asc`      | Status ordering                 |
| Combined query                      | All operations applied together |

---

# 15. Completion Checklist

Phase 11 passes validation when:

- [ ] `GET /api/submissions` exists.
- [ ] Authentication is enforced.
- [ ] `MENTOR` authorization is enforced.
- [ ] Non-mentor access is rejected.
- [ ] `page` works.
- [ ] `limit` works.
- [ ] `skip` is calculated correctly.
- [ ] `take` is calculated correctly.
- [ ] Excessive limits are controlled.
- [ ] `PENDING` filtering works.
- [ ] `APPROVED` filtering works.
- [ ] `REJECTED` filtering works.
- [ ] Project-name search works.
- [ ] Student-name search works.
- [ ] Student-email search works.
- [ ] Empty search is handled.
- [ ] Search and status work together.
- [ ] Search and pagination work together.
- [ ] Status and pagination work together.
- [ ] `createdAt` sorting works.
- [ ] `projectName` sorting works.
- [ ] `status` sorting works.
- [ ] `asc` works.
- [ ] `desc` works.
- [ ] Sorting fields are whitelisted.
- [ ] Invalid query parameters are handled safely.
- [ ] `total` represents filtered results.
- [ ] `totalPages` is calculated correctly.
- [ ] Response structure matches the contract.
- [ ] Sensitive student data is not exposed.
- [ ] All operations occur server-side.
- [ ] All table operations are controlled through query parameters.
- [ ] TypeScript checks pass.
- [ ] Lint checks pass.
- [ ] Relevant automated tests pass.
