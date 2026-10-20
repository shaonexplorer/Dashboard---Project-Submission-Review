# Phase 8 — Student Submission Backend Implementation Plan

## 1. Objective

Implement the backend API that allows authenticated users with the `STUDENT` role to submit their project.

The implementation must provide:

- Authentication protection
- Student-only authorization
- Request validation
- URL validation
- Duplicate submission protection
- Database-level uniqueness protection
- Submission-specific rate limiting
- Appropriate HTTP status codes
- Consistent API responses

---

## 2. API Endpoint

```http
POST /api/submissions
```

### Access

Authenticated users only.

### Required Role

```text
STUDENT
```

Users with other roles, including `MENTOR` and `ADMIN`, must not be allowed to create student submissions.

---

## 3. Expected Request Flow

The request should pass through the following pipeline:

```text
Client
  ↓
Submission Rate Limiter
  ↓
Authentication Middleware
  ↓
Role Authorization
  ↓
Request Validation
  ↓
Submission Controller
  ↓
Duplicate Check
  ↓
Submission Service
  ↓
Prisma
  ↓
PostgreSQL
```

The exact middleware order may follow the conventions already established by the application, but every protection must be applied before a submission is created.

---

## 4. Implementation Steps

### Step 1 — Define Submission Validation Schema

Create a validation schema for the submission payload.

Required fields:

```text
projectName
repoUrl
liveUrl
description
```

The schema must:

- Reject missing fields
- Reject invalid field types
- Reject invalid repository URLs
- Reject invalid live URLs
- Normalize or trim string input where appropriate

Validation must happen before database operations.

---

### Step 2 — Create Submission-Specific Rate Limiter

Create a dedicated limiter for:

```http
POST /api/submissions
```

Target configuration:

```text
Window: 10 minutes
Maximum requests: 5
Key: Client IP
```

When the request limit is exceeded, return:

```http
429 Too Many Requests
```

The submission limiter should be separate from any global API rate limiter.

---

### Step 3 — Protect the Route

Require an authenticated user before processing the submission.

Unauthenticated requests must not reach the submission creation logic.

Expected response:

```http
401 Unauthorized
```

---

### Step 4 — Enforce STUDENT Role

Only users whose authenticated role is:

```text
STUDENT
```

may create a submission.

Example authorization rule:

```text
user.role === STUDENT
```

A mentor or another unauthorized role must receive:

```http
403 Forbidden
```

---

### Step 5 — Check Existing Submission

Before creating a new record, query the database using the authenticated student's ID.

Conceptually:

```ts
findUnique({
  where: {
    studentId: authenticatedUser.id,
  },
});
```

If a submission already exists, return:

```http
409 Conflict
```

Do not create or overwrite the existing submission.

---

### Step 6 — Create Submission

If:

- Authentication succeeds
- User is a student
- Rate limit has not been exceeded
- Validation succeeds
- No previous submission exists

create the submission.

The `studentId` must come from the authenticated server-side user context.

It must never be accepted from the client request body.

Conceptually:

```ts
create({
  data: {
    studentId: authenticatedUser.id,
    projectName,
    repoUrl,
    liveUrl,
    description,
  },
});
```

---

### Step 7 — Enforce Database Uniqueness

The Prisma model must enforce one submission per student.

Example:

```prisma
model Submission {
  id          String   @id @default(cuid())
  projectName String
  repoUrl     String
  liveUrl     String
  description String
  studentId   String   @unique

  student     User     @relation(fields: [studentId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

The exact model should follow the existing schema and naming conventions.

The application-level duplicate check provides a clear API response, while the unique database constraint protects against race conditions and concurrent requests.

---

## 5. Duplicate Race-Condition Handling

Checking for an existing submission before insertion is not sufficient by itself.

Two requests could execute approximately simultaneously:

```text
Request A → duplicate check → none
Request B → duplicate check → none

Request A → INSERT → success
Request B → INSERT → unique constraint violation
```

Therefore:

```prisma
studentId String @unique
```

must remain the final source of truth.

The service/controller should catch Prisma's unique-constraint error and translate it into:

```http
409 Conflict
```

This guarantees consistent duplicate behavior even under concurrent requests.

---

## 6. Suggested Backend Structure

Adapt the names to the existing Express architecture.

```text
src/
├── controllers/
│   └── submission.controller.ts
├── services/
│   └── submission.service.ts
├── routes/
│   └── submission.routes.ts
├── validators/
│   └── submission.validator.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   └── submissionRateLimiter.middleware.ts
└── utils/
    └── ...
```

Responsibilities should remain separated:

```text
Route
  → middleware composition

Validator
  → request payload validation

Controller
  → HTTP request/response handling

Service
  → submission business logic

Prisma
  → persistence
```

---

## 7. Response Strategy

### Successful Creation

Return:

```http
201 Created
```

Example response structure:

```json
{
  "success": true,
  "message": "Project submitted successfully",
  "data": {
    "id": "submission-id",
    "projectName": "Project Name",
    "repoUrl": "https://github.com/user/project",
    "liveUrl": "https://project.example.com",
    "description": "Project description"
  }
}
```

Do not expose unnecessary internal database information.

---

### Validation Failure

Return:

```http
400 Bad Request
```

Example:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

### Unauthenticated Request

Return:

```http
401 Unauthorized
```

---

### Unauthorized Role

Return:

```http
403 Forbidden
```

---

### Duplicate Submission

Return:

```http
409 Conflict
```

Example:

```json
{
  "success": false,
  "message": "You have already submitted a project"
}
```

---

### Rate Limit Exceeded

Return:

```http
429 Too Many Requests
```

---

### Unexpected Server Failure

Return:

```http
500 Internal Server Error
```

Unexpected internal errors must not expose stack traces, Prisma internals, environment variables, or other sensitive implementation details.

---

## 8. Testing Plan

Test the endpoint with the following scenarios.

| Scenario                                        | Expected Result                   |
| ----------------------------------------------- | --------------------------------- |
| Valid student submission                        | `201 Created`                     |
| Missing `projectName`                           | `400 Bad Request`                 |
| Missing `repoUrl`                               | `400 Bad Request`                 |
| Missing `liveUrl`                               | `400 Bad Request`                 |
| Missing `description`                           | `400 Bad Request`                 |
| Invalid `repoUrl`                               | `400 Bad Request`                 |
| Invalid `liveUrl`                               | `400 Bad Request`                 |
| Unauthenticated request                         | `401 Unauthorized`                |
| Mentor submits project                          | `403 Forbidden`                   |
| Student submits twice                           | `409 Conflict`                    |
| Concurrent duplicate submissions                | One succeeds, other returns `409` |
| More than 5 requests in 10 minutes from same IP | `429 Too Many Requests`           |

---

## 9. Completion Checklist

Phase 8 is complete when:

- [ ] `POST /api/submissions` exists
- [ ] Endpoint requires authentication
- [ ] Only `STUDENT` users can submit
- [ ] `projectName` is validated
- [ ] `repoUrl` is validated
- [ ] `liveUrl` is validated
- [ ] `description` is validated
- [ ] Invalid URLs return `400`
- [ ] Missing required fields return `400`
- [ ] `studentId` comes from authenticated user context
- [ ] Existing submissions are checked before creation
- [ ] Duplicate submissions return `409`
- [ ] `studentId` has a database unique constraint
- [ ] Prisma unique-constraint races are converted to `409`
- [ ] Submission-specific rate limiting exists
- [ ] More than 5 requests per 10 minutes per IP are rejected
- [ ] Rate-limit violations return `429`
- [ ] Successful submissions return `201`
- [ ] Endpoint tests cover all completion criteria
