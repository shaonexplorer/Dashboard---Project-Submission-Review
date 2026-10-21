# Phase 10 — Validations

## 1. Purpose

This document defines the validation and verification rules for:

```http
GET /api/submissions/me
```

and the associated student submission frontend.

The goal is to verify authentication, authorization, ownership, API correctness, frontend state handling, cache synchronization, and refresh persistence.

---

# 2. Backend Validations

## VAL-BE-01 — Authentication Required

### Given

The request does not contain valid authentication credentials.

### When

```http
GET /api/submissions/me
```

is requested.

### Then

The backend must reject the request.

Expected:

```http
401 Unauthorized
```

or the project's equivalent authentication response.

---

## VAL-BE-02 — Student Role Required

### Given

The authenticated user does not have:

```text
STUDENT
```

role.

### When

the user requests:

```http
GET /api/submissions/me
```

### Then

access must be denied.

Expected:

```http
403 Forbidden
```

or the project's equivalent authorization response.

---

## VAL-BE-03 — Student Access Allowed

### Given

The authenticated user has:

```text
STUDENT
```

role.

### And

the student has a submission.

### When

the student requests:

```http
GET /api/submissions/me
```

### Then

the endpoint must return the student's submission.

Expected:

```http
200 OK
```

---

## VAL-BE-04 — Ownership

### Given

Student A and Student B both have submissions.

### When

Student A requests:

```http
GET /api/submissions/me
```

### Then

only Student A's submission must be returned.

Student B's submission data must never be included.

---

## VAL-BE-05 — Ignore Arbitrary Ownership Input

The endpoint must not allow the client to change ownership resolution using arbitrary values such as:

```http
GET /api/submissions/me?studentId=student-b
```

If unexpected ownership-related parameters are supplied, they must not change which submission is returned.

The authenticated identity remains authoritative.

---

## VAL-BE-06 — Missing Submission

### Given

The authenticated student does not have a submission.

### When

the student requests:

```http
GET /api/submissions/me
```

### Then

the API must return the project's defined no-submission response.

Recommended:

```http
404 Not Found
```

Example:

```json
{
  "message": "Submission not found"
}
```

---

## VAL-BE-07 — Response Fields

For an existing submission, verify that the response contains the fields required by the frontend.

At minimum:

```text
projectName
repoUrl
liveUrl
description
status
feedback
reviewedAt
```

An identifier and additional timestamps may also be returned.

---

## VAL-BE-08 — Nullable Feedback

An unreviewed submission may contain:

```json
{
  "feedback": null
}
```

The endpoint must not fail because feedback is missing.

---

## VAL-BE-09 — Nullable Review Timestamp

An unreviewed submission may contain:

```json
{
  "reviewedAt": null
}
```

The endpoint must serialize the nullable value correctly.

---

## VAL-BE-10 — Reviewed Submission

For a reviewed submission, verify that:

```text
status
feedback
reviewedAt
```

match the persisted database values.

---

## VAL-BE-11 — `/me` Route Resolution

If the API also contains:

```http
GET /api/submissions/:id
```

verify that:

```http
GET /api/submissions/me
```

is handled by the intended `/me` endpoint.

The server must not attempt to find a submission whose ID is:

```text
me
```

---

# 3. Frontend Validations

## VAL-FE-01 — Query Key

Verify that the student submission query uses exactly:

```ts
["mySubmission"];
```

as its base query key.

---

## VAL-FE-02 — Backend Fetch

Verify that the query retrieves data through:

```http
GET /api/submissions/me
```

The submission displayed on screen must originate from the API response.

---

## VAL-FE-03 — Loading State

Simulate a pending request.

The page must display a loading indicator or skeleton.

It must not display:

```text
You haven't submitted a project yet.
```

while the request is still pending.

---

## VAL-FE-04 — Success State

Mock or retrieve a successful submission.

Verify that the UI displays:

- Project name
- Repository link
- Live link
- Description
- Status
- Feedback

When applicable, verify that the review timestamp is also displayed.

---

## VAL-FE-05 — Repository Link

Verify that:

```text
repoUrl
```

is rendered as a clickable link and points to the URL returned by the backend.

---

## VAL-FE-06 — Live Link

When:

```ts
liveUrl !== null;
```

verify that the live project URL is displayed as a usable link.

When:

```ts
liveUrl === null;
```

verify that the UI displays an appropriate fallback or omits the link.

The UI must not render:

```text
null
undefined
```

---

## VAL-FE-07 — Pending Status

Given:

```json
{
  "status": "PENDING"
}
```

verify that the UI correctly represents the pending state.

---

## VAL-FE-08 — Reviewed Status

Given a reviewed submission, verify that the frontend renders the status exactly according to the backend value and the application's status mapping.

The frontend must not infer status from feedback or review timestamps.

---

## VAL-FE-09 — Feedback Exists

Given:

```json
{
  "feedback": "Good implementation. Improve error handling."
}
```

verify that the complete feedback is visible to the student.

---

## VAL-FE-10 — Feedback Missing

Given:

```json
{
  "feedback": null
}
```

verify that the UI displays an appropriate fallback such as:

```text
No feedback yet.
```

---

## VAL-FE-11 — Review Timestamp Exists

Given a valid:

```json
{
  "reviewedAt": "2026-10-21T10:30:00.000Z"
}
```

verify that the UI renders a human-readable date/time using the project's date formatting convention.

---

## VAL-FE-12 — Review Timestamp Missing

Given:

```json
{
  "reviewedAt": null
}
```

verify that no invalid date appears.

The UI must not display values such as:

```text
Invalid Date
null
undefined
```

---

## VAL-FE-13 — No Submission

Given that the API returns the defined no-submission response, verify that the UI renders the intended empty state.

Example:

```text
You haven't submitted a project yet.
```

---

## VAL-FE-14 — Unexpected Server Error

Given:

```http
500 Internal Server Error
```

verify that the frontend displays an error state.

It must not incorrectly display the no-submission state.

---

## VAL-FE-15 — Authentication Error

Given:

```http
401 Unauthorized
```

verify that the application follows its existing authentication/session-expiration behavior.

---

# 4. Persistence Validations

## VAL-PERSIST-01 — Browser Refresh

### Given

The student has an existing submission.

### When

the student opens the submission page and refreshes the browser.

### Then

the frontend must retrieve the submission from:

```http
GET /api/submissions/me
```

and render the submission again.

---

## VAL-PERSIST-02 — No Local State Dependency

Clear temporary frontend state and refresh the page.

The submission must still appear because it exists in the backend/database.

The implementation must not require:

```text
localStorage
sessionStorage
React component state
navigation state
```

to recover the submission.

---

## VAL-PERSIST-03 — Backend Is Authoritative

Modify the submission through the backend/database or an existing valid mutation flow.

Refetch:

```ts
["mySubmission"];
```

The UI must reflect the updated backend value.

---

# 5. TanStack Query Cache Validations

## VAL-CACHE-01 — Submission Creation

After successfully creating a submission, verify that:

```ts
["mySubmission"];
```

is invalidated or updated.

The student must not need to manually refresh the browser to see the newly created submission.

---

## VAL-CACHE-02 — Submission Update

If students can edit their submission, verify that a successful update synchronizes:

```ts
["mySubmission"];
```

with the new backend data.

---

## VAL-CACHE-03 — Reviewer Update

If another workflow changes:

```text
status
feedback
reviewedAt
```

verify that a subsequent refetch of:

```ts
["mySubmission"];
```

returns and displays the latest values.

---

# 6. Security Validation Matrix

| Scenario                                       | Expected                                   |
| ---------------------------------------------- | ------------------------------------------ |
| Unauthenticated request                        | 401                                        |
| Authenticated STUDENT with submission          | 200                                        |
| Authenticated STUDENT without submission       | 404 or project-defined equivalent          |
| Authenticated non-STUDENT                      | 403                                        |
| Student A requests `/me`                       | Student A submission                       |
| Student B requests `/me`                       | Student B submission                       |
| Student attempts to specify another student ID | Must not expose other student's submission |

---

# 7. UI State Validation Matrix

| API/Query State    | Expected UI                      |
| ------------------ | -------------------------------- |
| Query pending      | Loading state                    |
| 200 + submission   | Submission details               |
| No submission      | Empty submission state           |
| 401                | Existing authentication handling |
| 403                | Existing unauthorized handling   |
| 500                | Error state                      |
| `feedback: null`   | No-feedback fallback             |
| `reviewedAt: null` | No invalid date                  |
| `liveUrl: null`    | Safe missing-link state          |

---

# 8. Manual End-to-End Validation

Perform the following flow:

```text
1. Sign in as STUDENT.
2. Create/ensure a submission exists.
3. Navigate to the student submission page.
4. Verify GET /api/submissions/me is requested.
5. Verify project name.
6. Verify repository URL.
7. Verify live URL.
8. Verify description.
9. Verify status.
10. Verify feedback.
11. Verify review timestamp when applicable.
12. Refresh the browser.
13. Verify GET /api/submissions/me runs again or the query restores/refetches correctly.
14. Verify the submission remains visible.
15. Sign in as another student.
16. Verify that student's own submission is returned.
17. Sign in as a non-STUDENT account.
18. Verify access is denied.
```

---

# 9. Completion Checklist

Phase 10 passes validation when:

- [ ] `GET /api/submissions/me` works.
- [ ] Authentication is enforced.
- [ ] `STUDENT` role authorization is enforced.
- [ ] Submission ownership is enforced.
- [ ] A student cannot retrieve another student's submission.
- [ ] Missing submission is handled.
- [ ] Project name is returned and displayed.
- [ ] Repository URL is returned and displayed.
- [ ] Live URL is returned and displayed.
- [ ] Description is returned and displayed.
- [ ] Status is returned and displayed.
- [ ] Feedback is returned and displayed.
- [ ] Nullable feedback is handled.
- [ ] Review timestamp is returned and displayed when available.
- [ ] Nullable review timestamp is handled.
- [ ] TanStack Query uses `["mySubmission"]`.
- [ ] Loading state works.
- [ ] Empty state works.
- [ ] Error state works.
- [ ] Submission mutations synchronize `["mySubmission"]`.
- [ ] Browser refresh does not lose submission state.
- [ ] Submission data always originates from the backend.
- [ ] TypeScript checks pass.
- [ ] Linting passes.
- [ ] Relevant automated tests pass.
