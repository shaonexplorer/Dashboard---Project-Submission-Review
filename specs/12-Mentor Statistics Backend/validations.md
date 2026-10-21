# Phase 12 — Mentor Statistics Backend Validations

## 1. Purpose

Validate the behavior, security, aggregation correctness, and response
structure of:

```http
GET /api/submissions/stats
```

---

# 2. Authentication & Authorization

## VAL-AUTH-01 — Unauthenticated Request

### Request

```http
GET /api/submissions/stats
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
GET /api/submissions/stats
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
GET /api/submissions/stats
```

must be rejected.

Recommended:

```http
403 Forbidden
```

---

## VAL-AUTH-04 — Authorization Precedes Data Access

Verify that the role check runs before any statistics query is issued. A
`STUDENT` request must not be able to infer table contents from the response
timing or from a partial result.

---

# 3. Response Structure

## VAL-RESP-01 — Standard Envelope

Verify the response follows:

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

## VAL-RESP-02 — All Four Fields Present

All four keys must be present on every successful response:

```text
total
pending
approved
rejected
```

A missing key must never be replaced by an absent value in the JSON.

---

## VAL-RESP-03 — Numeric Values

Every count must be a JSON number.

Verify that no count is returned as a string, `null`, or `undefined`.

---

## VAL-RESP-04 — No Extra Payload

The `data` payload must contain the four counts and nothing else.

It must not include submission rows, student names, emails, or any other
per-record data.

---

# 4. Count Correctness

## VAL-COUNT-01 — Total Matches The Table

Given the database contains `N` submissions in total:

```text
total = N
```

Verify against a direct table count, not against a page of the list endpoint.

---

## VAL-COUNT-02 — Per-Status Counts

Given the database contains:

| Status     | Rows |
| ---------- | ---- |
| `PENDING`  | 4    |
| `APPROVED` | 6    |
| `REJECTED` | 2    |

the response must report:

```json
{
  "total": 12,
  "pending": 4,
  "approved": 6,
  "rejected": 2
}
```

---

## VAL-COUNT-03 — Counts Sum To The Total

Verify:

```text
pending + approved + rejected = total
```

for every dataset, because the `status` column is a closed enum.

---

## VAL-COUNT-04 — Independent Of Pagination

The statistics endpoint takes no pagination parameters.

Verify that the returned counts are identical regardless of any query
parameters sent alongside the request. The statistics always describe the
full table.

---

## VAL-COUNT-05 — Independent Of Filters

Verify that the statistics are not narrowed by the list endpoint's `status`
or `search` filters. Filtering the table must not change the counts reported
by the statistics endpoint.

---

## VAL-COUNT-06 — Reflect The Current Database State

Approve or reject a submission, then re-request the statistics.

Expected:

```text
pending decreases by 1
approved (or rejected) increases by 1
total stays the same
```

---

## VAL-COUNT-07 — Empty Database

Given a table with no submissions, the response must be:

```json
{
  "total": 0,
  "pending": 0,
  "approved": 0,
  "rejected": 0
}
```

A status with no rows must report `0`, not be omitted.

---

## VAL-COUNT-08 — Single Status Present

Given a table where every submission is `PENDING`:

```json
{
  "total": 3,
  "pending": 3,
  "approved": 0,
  "rejected": 0
}
```

The statuses with no rows must still be reported as `0`.

---

# 5. Aggregation Requirements

## VAL-AGG-01 — Database-Side Counting

The counts must be produced by database aggregation or count queries.

The implementation must not:

```ts
const submissions = await prisma.submission.findMany();
const pending = submissions.filter((s) => s.status === "PENDING").length;
```

---

## VAL-AGG-02 — Not Derived From A Paginated Result

Verify the counts are not read from the response of the paginated list
endpoint, and that the query does not apply `skip`/`take`.

A count computed from one page of ten rows must not be returned as the
table total.

---

## VAL-AGG-03 — Constant Query Count

The endpoint must issue a fixed number of aggregation queries regardless of
how many submissions exist.

The number of queries must not grow with the size of the table.

---

## VAL-AGG-04 — Concurrent Queries

Verify the total count and the status grouping are issued together rather
than one after the other.

---

## VAL-AGG-05 — No Row Fetching

Verify the endpoint selects no submission rows. Only counts are read.

---

# 6. Security Validations

Verify the endpoint does not expose:

```text
project names
repository or live URLs
descriptions
student names or emails
password hashes
JWT values
```

---

# 7. Performance Validations

## VAL-PERF-01 — Constant Work Per Request

The endpoint's cost must not depend on the number of submissions.

---

## VAL-PERF-02 — No N+1 Queries

Verify a single request issues the expected small, fixed set of queries.

---

# 8. Manual API Test Matrix

| Request                      | Expected                             |
| ---------------------------- | ------------------------------------ |
| `/api/submissions/stats`     | Four counts describing the full table |
| No auth cookie               | 401                                   |
| Student session cookie       | 403                                   |
| Mentor session cookie        | 200 with the four counts              |
| Empty table                  | Four zeroes                           |
| After a status change        | Counts reflect the new state          |

---

# 9. Completion Checklist

Phase 12 passes validation when:

- [ ] `GET /api/submissions/stats` exists.
- [ ] Authentication is enforced.
- [ ] `MENTOR` authorization is enforced.
- [ ] Non-mentor access is rejected.
- [ ] The route is registered before any dynamic `/:id` route.
- [ ] `total` reflects every submission in the database.
- [ ] `pending`, `approved` and `rejected` reflect the matching rows.
- [ ] All four counts are always present.
- [ ] All four counts are numbers.
- [ ] An empty table returns four zeroes.
- [ ] Counts are produced by database aggregation.
- [ ] Counts are not derived from a paginated result set.
- [ ] The total count and the grouping are issued concurrently.
- [ ] The response follows the standard envelope.
- [ ] No submission or student data is exposed.
- [ ] TypeScript checks pass.
