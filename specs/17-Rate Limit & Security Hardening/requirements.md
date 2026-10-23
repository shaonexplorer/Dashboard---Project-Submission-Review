# Phase 17 — Security Requirements

## 1. Rate Limiting Requirements

### REQ-SEC-001 — Global Rate Limiter

The backend MUST implement a global rate limiter for API requests.

The limiter MUST:

- Restrict excessive requests from individual clients
- Return HTTP `429` when the limit is exceeded
- Use standard rate-limit headers
- Avoid leaking internal implementation details

---

### REQ-SEC-002 — Authentication Rate Limiter

Authentication endpoints MUST use a stricter rate limit than general API endpoints.

Protected endpoints include:

```text
POST /auth/login
POST /auth/signup
```

The limiter MUST mitigate:

- Brute-force login attempts
- Credential stuffing
- Automated signup abuse

---

### REQ-SEC-003 — Submission Rate Limiter

Project submission endpoints MUST have a dedicated rate limiter.

Target endpoint:

```text
POST /submissions
```

The limiter MUST return HTTP `429` when the configured threshold is exceeded.

Database-level duplicate-submission protection MUST remain in place.

---

## 2. HTTP Security Requirements

### REQ-SEC-004 — Helmet

The Express application MUST use Helmet globally.

Security headers SHOULD remain enabled unless a specific header conflicts with documented application requirements.

---

### REQ-SEC-005 — Strict CORS

The API MUST only accept cross-origin requests from explicitly configured trusted frontend origins.

The application MUST NOT use unrestricted wildcard origins for authenticated API access.

Allowed origins MUST be configurable through validated environment configuration.

---

## 3. Input Security Requirements

### REQ-SEC-006 — Input Trimming

Relevant incoming string values MUST have unnecessary leading and trailing whitespace removed before being processed.

This applies to fields such as:

```text
email
projectName
repoUrl
liveLink
description
```

Password values MUST NOT be automatically trimmed.

---

### REQ-SEC-007 — Existing Validation

Input trimming MUST complement rather than replace schema validation.

Existing validation rules for:

- Required fields
- Email format
- URL format
- String lengths
- Enum values

MUST continue to be enforced.

---

## 4. Environment Requirements

### REQ-SEC-008 — Environment Validation

Required environment variables MUST be validated during server startup.

At minimum:

```text
DATABASE_URL
JWT_SECRET
```

Invalid or missing required environment variables MUST prevent the application from starting.

---

### REQ-SEC-009 — Secret Management

Sensitive configuration MUST NOT be hardcoded.

The following values MUST NOT be committed:

```text
JWT_SECRET
DATABASE_URL containing real credentials
```

`.env` files containing secrets MUST be ignored by Git.

---

### REQ-SEC-010 — Example Environment File

The repository SHOULD provide an `.env.example`.

It MUST contain placeholders only.

It MUST NOT contain real:

- Passwords
- Database credentials
- JWT secrets
- Private tokens

---

## 5. Authentication Security Requirements

### REQ-SEC-011 — JWT Expiration

Every JWT MUST contain an expiration.

The expiration duration MUST be configurable.

Example:

```text
JWT_EXPIRES_IN=1d
```

---

### REQ-SEC-012 — JWT Verification

Protected endpoints MUST reject:

- Missing tokens
- Invalid tokens
- Malformed tokens
- Expired tokens
- Tokens with invalid signatures

Authentication failures SHOULD use appropriate `401` or `403` responses depending on the failure semantics.

---

## 6. Password Security Requirements

### REQ-SEC-013 — Password Hash Protection

`passwordHash` MUST NEVER be returned by any API endpoint.

This applies to:

- Signup
- Login
- User profile
- Current-user endpoint
- Student endpoints
- Mentor/admin endpoints
- Nested user relations

Prisma queries SHOULD explicitly select safe fields whenever practical.

---

### REQ-SEC-014 — Password Input

Raw passwords MUST NOT be:

- Logged
- Returned in API responses
- Stored as plaintext
- Included in error responses

---

## 7. Error Handling Requirements

### REQ-SEC-015 — Safe Production Errors

Unexpected production errors MUST return sanitized responses.

Responses MUST NOT expose:

```text
stack traces
database queries
Prisma internals
filesystem paths
environment variables
credentials
JWT secrets
```

---

### REQ-SEC-016 — Server-Side Logging

Unexpected errors MAY be logged server-side for debugging and monitoring.

Sensitive values MUST NOT be intentionally included in logs.

---

### REQ-SEC-017 — Error Handler

Unhandled application errors MUST flow through a centralized Express error handler.

The error handler MUST return a consistent response format.

Example:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 8. Security Dependencies

Expected backend dependencies include:

```text
helmet
cors
express-rate-limit
zod
```

Existing JWT, password hashing, Express, Prisma, and validation dependencies should continue to be used where appropriate.

---

## 9. Repository Security

The repository MUST be reviewed to ensure that:

```text
passwordHash is never returned
JWT_SECRET is not committed
DATABASE_URL is not committed
```

`.gitignore` MUST protect local environment files.

If credentials were accidentally committed previously, they MUST be considered compromised and rotated.

---

## 10. Completion Requirements

Phase 17 is complete only when:

1. Global rate limiting is active.
2. Authentication endpoints have stricter rate limiting.
3. Submission endpoints have dedicated rate limiting.
4. Helmet is enabled.
5. CORS is restricted to trusted origins.
6. Relevant input strings are trimmed.
7. Environment configuration is validated.
8. JWT expiration is enforced.
9. Error responses are sanitized.
10. Password hashes cannot appear in API responses.
11. Secrets are absent from committed source/configuration.
12. The security checklist in `specs.md` passes.
