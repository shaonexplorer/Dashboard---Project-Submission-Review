# Phase 04 — Validations

## Purpose

This document defines the validation and verification checks required to consider Phase 04 — Authentication Backend complete.

---

# 1. Setup Validation

## VAL-001 — Authentication Dependencies

Confirm the backend contains the dependencies required for:

- password hashing
- JWT signing
- JWT verification

Expected: authentication modules compile and run successfully.

## VAL-002 — JWT Environment Variable

Confirm:

```env
JWT_SECRET=
```

is available to the backend through centralized configuration.

Validate that:

- missing required configuration causes a controlled failure
- the secret is not hard-coded
- `.env` is ignored by Git

---

# 2. Signup Validation

## VAL-003 — Valid Student Signup

Send:

```http
POST /api/auth/signup
Content-Type: application/json
```

Example body:

```json
{
  "fullName": "Test Student",
  "email": "student@example.com",
  "password": "StrongPassword123"
}
```

Expected:

- request succeeds
- user is persisted
- user role is `STUDENT`
- password is not returned
- passwordHash is not returned

## VAL-004 — Missing Full Name

Submit signup without `fullName`.

Expected: request rejected and user not created.

## VAL-005 — Invalid Email

Submit signup with an invalid email.

Expected: request rejected and user not created.

## VAL-006 — Missing Password

Submit signup without a password.

Expected: request rejected and user not created.

## VAL-007 — Email Normalization

Register using an email containing supported normalization differences such as letter casing.

Expected: normalization is consistent for storage and lookup.

## VAL-008 — Duplicate Email

Attempt to register the same normalized email twice.

Expected:

```http
409 Conflict
```

or the project's equivalent standardized conflict response.

Verify only one user exists for the email.

## VAL-009 — Public Role Escalation Prevention

Attempt signup with:

```json
{
  "role": "MENTOR"
}
```

Expected: the created account is still `STUDENT`.

---

# 3. Password Security Validation

## VAL-010 — Password Is Hashed

Inspect the created user record.

Expected:

- stored value is not equal to the plaintext password
- password hash is present

## VAL-011 — Password Hash Not Returned

Inspect responses from:

- signup
- login
- `/api/auth/me`

Expected:

```text
passwordHash is absent
password is absent
```

---

# 4. Login Validation

## VAL-012 — Valid Student Login

Send:

```http
POST /api/auth/login
```

with valid student credentials.

Expected:

- request succeeds
- JWT is returned
- safe student data is returned

## VAL-013 — Invalid Password

Login using a valid email and incorrect password.

Expected:

```http
401 Unauthorized
```

No token must be returned.

## VAL-014 — Unknown Email

Login using an email that does not exist.

Expected:

```http
401 Unauthorized
```

Response should not reveal sensitive account lookup details.

## VAL-015 — Invalid Login Input

Test malformed email, missing email, and missing password.

Expected: validation failure and no token generated.

## VAL-016 — Mentor Login Capability

Using an existing MENTOR record, submit valid credentials.

Expected:

- request succeeds
- JWT is returned
- returned role is `MENTOR`

Note: creating the mentor record itself belongs to the next mentor seed phase.

---

# 5. JWT Validation

## VAL-017 — JWT Contains Required Identity

Decode a valid development/test token.

Confirm payload contains enough information for middleware to identify:

- user ID
- role

## VAL-018 — Invalid JWT

Call a protected endpoint using:

```http
Authorization: Bearer invalid-token
```

Expected:

```http
401 Unauthorized
```

## VAL-019 — Missing JWT

Call:

```http
GET /api/auth/me
```

without an Authorization header.

Expected:

```http
401 Unauthorized
```

## VAL-020 — Invalid Authorization Format

Test headers such as:

```text
Authorization: <token>
Authorization: Basic <token>
Authorization: Bearer
```

Expected:

```http
401 Unauthorized
```

---

# 6. Authentication Middleware Validation

## VAL-021 — Valid Token Attaches User

Call a protected route with a valid token.

Confirm the downstream handler can access:

- user ID
- role

## VAL-022 — Middleware Reusability

Confirm `authenticate` can protect multiple routes without duplicated token-verification logic.

---

# 7. Authorization Middleware Validation

## VAL-023 — Allowed Student Role

Protect a route using:

```ts
authorize("STUDENT")
```

Call it using a STUDENT token.

Expected: request continues.

## VAL-024 — Student Blocked From Mentor Route

Protect a route using:

```ts
authorize("MENTOR")
```

Call it using a STUDENT token.

Expected:

```http
403 Forbidden
```

## VAL-025 — Mentor Allowed

Call the MENTOR-protected route using a valid MENTOR token.

Expected: request continues.

## VAL-026 — Authentication vs Authorization

Verify:

```text
No/invalid token     → 401
Valid wrong-role JWT → 403
```

---

# 8. Current User Endpoint Validation

## VAL-027 — Authenticated `/api/auth/me`

Call:

```http
GET /api/auth/me
Authorization: Bearer <valid-token>
```

Expected:

- request succeeds
- correct user is returned
- role is returned
- sensitive password fields are absent

## VAL-028 — `/api/auth/me` With Invalid Token

Expected:

```http
401 Unauthorized
```

---

# 9. Architecture Validation

## VAL-029 — Layer Separation

Verify authentication follows:

```text
route
  ↓
validation / auth middleware
  ↓
controller
  ↓
service
  ↓
Prisma
```

Controllers should not contain unnecessary database/business logic.

## VAL-030 — Existing Error Handler Used

Trigger duplicate signup, invalid login, invalid token, and unauthorized role.

Confirm responses use the project's standardized error conventions.

## VAL-031 — Existing Prisma Client Reused

Verify authentication does not instantiate a new Prisma client per request.

---

# 10. TypeScript and Build Validation

## VAL-032 — Request Auth Typing

Verify TypeScript recognizes authenticated request data without unsafe `any` usage.

## VAL-033 — TypeScript Check

Run the backend TypeScript validation command.

Expected: 0 TypeScript errors.

## VAL-034 — Production Build

Run the backend production build.

Expected: build succeeds.

---

# 11. Regression Validation

## VAL-035 — Health Endpoint Still Works

Verify:

```http
GET /api/health
```

still returns the expected running-server response.

Authentication changes must not break the existing backend foundation.

---

# 12. Phase Completion Checklist

```text
[ ] POST /api/auth/signup works
[ ] Signup creates STUDENT only
[ ] Signup validation works
[ ] Duplicate email is rejected
[ ] Email normalization works consistently
[ ] Password is hashed
[ ] Plaintext password is never stored
[ ] POST /api/auth/login works
[ ] Invalid credentials return 401
[ ] Valid login returns JWT
[ ] STUDENT can login
[ ] Existing MENTOR can login
[ ] authenticate middleware works
[ ] Missing token returns 401
[ ] Invalid token returns 401
[ ] authorize(...roles) works
[ ] Wrong role returns 403
[ ] GET /api/auth/me works
[ ] Sensitive password fields never appear in responses
[ ] Existing Prisma client is reused
[ ] Existing validation middleware is reused
[ ] Existing global error handling is reused
[ ] TypeScript checks pass
[ ] Production build passes
[ ] Existing health endpoint still works
```
