# Phase 8 — Student Submission Backend Requirements

## 1. Functional Requirements

### REQ-SUB-001 — Submission Endpoint

The backend must expose:

```http
POST /api/submissions
```

The endpoint must create a project submission for the currently authenticated student.

---

### REQ-SUB-002 — Authentication

The submission endpoint must require authentication.

The backend must identify the user from the application's trusted authentication context.

The API must not trust a user ID or student ID supplied by the client.

Unauthenticated requests must return:

```http
401 Unauthorized
```

---

### REQ-SUB-003 — Student Authorization

Only users with the role:

```text
STUDENT
```

may create project submissions.

Users with roles such as:

```text
MENTOR
ADMIN
```

must not be allowed to create a student submission.

Unauthorized roles must receive:

```http
403 Forbidden
```

---

### REQ-SUB-004 — Required Submission Data

The request body must contain:

```text
projectName
repoUrl
liveUrl
description
```

All four fields are required.

Example:

```json
{
  "projectName": "Project Review Dashboard",
  "repoUrl": "https://github.com/student/project-review-dashboard",
  "liveUrl": "https://project-review-dashboard.example.com",
  "description": "A project submission and review dashboard."
}
```

---

### REQ-SUB-005 — Request Validation

The backend must validate the request body before attempting to create the submission.

Validation must reject:

- Missing required fields
- Empty required values
- Invalid data types
- Invalid `repoUrl`
- Invalid `liveUrl`

Invalid payloads must return:

```http
400 Bad Request
```

---

### REQ-SUB-006 — Repository URL

`repoUrl` must contain a syntactically valid URL.

The URL should use an allowed web protocol:

```text
http
https
```

If the project specification requires GitHub repositories specifically, the validation layer should additionally restrict the hostname to the approved GitHub domain.

---

### REQ-SUB-007 — Live URL

`liveUrl` must contain a syntactically valid web URL.

Allowed protocols:

```text
http
https
```

Malformed URLs must be rejected.

---

### REQ-SUB-008 — One Submission Per Student

Each student may have only one project submission.

Before insertion, the application must check for an existing submission associated with the authenticated student's ID.

If one exists, return:

```http
409 Conflict
```

---

### REQ-SUB-009 — Database Duplicate Protection

The database schema must enforce the one-submission-per-student rule.

Required Prisma constraint:

```prisma
studentId String @unique
```

The database constraint is mandatory even when an application-level duplicate check exists.

---

### REQ-SUB-010 — Concurrent Duplicate Protection

The backend must handle database unique-constraint violations caused by concurrent submission requests.

A unique constraint violation for `studentId` must be converted into:

```http
409 Conflict
```

It must not be exposed as an unhandled `500` error.

---

### REQ-SUB-011 — Student Identity

`studentId` must be derived from the authenticated user.

Example conceptual behavior:

```ts
const studentId = req.user.id;
```

The following must not be accepted as authoritative client input:

```json
{
  "studentId": "some-user-id"
}
```

This prevents a student from creating a submission on behalf of another user.

---

### REQ-SUB-012 — Submission Creation

After successful authorization, validation, and duplicate checks, the backend must persist:

```text
studentId
projectName
repoUrl
liveUrl
description
```

The submission should also use the application's normal ID and timestamp fields.

---

### REQ-SUB-013 — Successful Response

Successful creation must return:

```http
201 Created
```

The response should contain the newly created submission or the safe public representation of that submission.

---

## 2. Rate-Limiting Requirements

### REQ-RATE-001 — Dedicated Limiter

The submission endpoint must use a submission-specific rate limiter.

It must not depend exclusively on a global API limiter.

---

### REQ-RATE-002 — Rate-Limit Target

The target configuration is:

```text
5 requests
per 10 minutes
per IP address
```

Conceptually:

```text
windowMs = 10 minutes
max = 5
key = client IP
```

---

### REQ-RATE-003 — Rate-Limit Response

Requests exceeding the configured limit must return:

```http
429 Too Many Requests
```

The limiter should use the application's standard API error format.

---

## 3. Security Requirements

### SEC-SUB-001

Never trust `studentId` from the request body.

### SEC-SUB-002

Authentication must occur before protected submission business logic is executed.

### SEC-SUB-003

Authorization must be enforced server-side.

Frontend route protection must never be treated as sufficient authorization.

### SEC-SUB-004

Request data must be validated before being passed into persistence logic.

### SEC-SUB-005

Database errors must not expose sensitive internal information to the client.

### SEC-SUB-006

Database uniqueness must protect against duplicate submissions even when simultaneous requests bypass the initial application-level duplicate check.

---

## 4. HTTP Status Requirements

| Condition                           |                      Status |
| ----------------------------------- | --------------------------: |
| Submission successfully created     |               `201 Created` |
| Invalid/missing request data        |           `400 Bad Request` |
| User is not authenticated           |          `401 Unauthorized` |
| Authenticated user is not a student |             `403 Forbidden` |
| Student already has a submission    |              `409 Conflict` |
| Submission rate limit exceeded      |     `429 Too Many Requests` |
| Unexpected backend failure          | `500 Internal Server Error` |

---

## 5. Non-Functional Requirements

### Maintainability

Submission functionality should follow the project's existing separation of concerns.

Prefer:

```text
Route
→ Middleware
→ Controller
→ Service
→ Prisma
```

Avoid putting authentication, validation, database access, and HTTP response logic into one large route handler.

### Consistency

Error and success responses should follow the response conventions already used by the application.

### Type Safety

The implementation should preserve TypeScript type safety and avoid unnecessary `any` usage.

### Database Integrity

Application validation must not replace database constraints for invariants such as one submission per student.

---

## 6. Acceptance Criteria

The implementation is accepted when all of the following are true:

```text
✓ Valid student submission succeeds
✓ Missing projectName fails
✓ Missing repoUrl fails
✓ Missing liveUrl fails
✓ Missing description fails
✓ Invalid repoUrl fails
✓ Invalid liveUrl fails
✓ Unauthenticated request fails
✓ Mentor cannot submit
✓ Duplicate student submission returns 409
✓ Database prevents concurrent duplicate submissions
✓ Rate limiter allows requests within the limit
✓ Rate limiter rejects requests above the limit
```
