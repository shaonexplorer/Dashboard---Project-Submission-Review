# Phase 17 — Rate Limiting and Security Hardening Plan

## Objective

Harden the backend API against common security risks and abuse by introducing rate limiting, secure HTTP headers, strict CORS configuration, input sanitization, environment validation, secure JWT configuration, and safe error handling.

The implementation must also ensure that sensitive information such as password hashes, JWT secrets, database credentials, stack traces, and internal error details are never exposed to clients or committed to the repository.

---

## 1. Global Rate Limiting

Implement a global API rate limiter using `express-rate-limit`.

Apply the limiter to all API routes.

Recommended configuration:

- Window: 15 minutes
- Maximum requests: 100 requests per IP per window
- Return HTTP `429 Too Many Requests` when exceeded
- Return a generic error message
- Include standard rate-limit headers
- Disable legacy headers

Example scope:

```text
/api/*
```

The global limiter should provide baseline protection against API abuse while allowing stricter limits to be applied to sensitive endpoints.

---

## 2. Authentication Rate Limiter

Create a stricter rate limiter specifically for authentication endpoints.

Apply it to:

```text
POST /auth/login
POST /auth/signup
```

Recommended configuration:

- Window: 15 minutes
- Maximum attempts: 10 per IP
- Return `429` when exceeded
- Do not expose unnecessary internal information

The authentication limiter should execute before authentication logic.

Purpose:

- Reduce brute-force attacks
- Reduce credential stuffing attempts
- Prevent automated account creation abuse

---

## 3. Submission Rate Limiter

Create a dedicated rate limiter for project submission.

Apply it to:

```text
POST /submissions
```

Recommended configuration:

- Window: 15 minutes
- Maximum requests: 5 per IP
- Return `429` when exceeded

This limiter supplements the existing duplicate-submission validation.

Rate limiting must not replace database-level duplicate protection.

---

## 4. Helmet

Install and configure `helmet`.

Apply it globally:

```text
app.use(helmet());
```

Helmet should configure appropriate HTTP security headers, including protections related to:

- MIME sniffing
- Framing
- Referrer information
- Cross-origin resource policies
- Other common HTTP-header security issues

Any Helmet configuration that conflicts with the frontend/API architecture should be explicitly configured rather than disabling Helmet entirely.

---

## 5. Strict CORS

Replace permissive CORS configuration with an explicit origin allowlist.

Frontend origins must come from validated environment configuration.

Example:

```env
CLIENT_URL=http://localhost:3000
```

Production must use the real frontend origin.

Requirements:

- Never use `origin: "*"` for authenticated endpoints
- Allow only configured origins
- Define required HTTP methods
- Define required request headers
- Configure credentials only when required by the authentication strategy
- Reject unauthorized origins

Example allowed methods:

```text
GET
POST
PUT
PATCH
DELETE
OPTIONS
```

Example allowed headers:

```text
Content-Type
Authorization
```

---

## 6. Input Trimming

Normalize incoming string inputs before business logic and database operations.

Trim leading and trailing whitespace from relevant string fields.

Examples:

```text
email
name
projectName
repoUrl
liveLink
description
```

Input normalization should occur before validation where appropriate.

Passwords must not be blindly trimmed because whitespace may intentionally be part of a password.

Avoid recursively modifying arbitrary request objects without considering expected field types.

---

## 7. Environment Validation

Create centralized environment validation.

Required environment variables should include at minimum:

```text
DATABASE_URL
JWT_SECRET
```

Other configuration may include:

```text
NODE_ENV
PORT
CLIENT_URL
JWT_EXPIRES_IN
```

Use a schema-validation library such as Zod to validate environment variables during application startup.

The server must fail fast when required configuration is missing or invalid.

Example flow:

```text
process.env
   ↓
Environment schema
   ↓
Validated configuration
   ↓
Application
```

Application code should consume validated configuration instead of repeatedly accessing arbitrary `process.env` values.

---

## 8. JWT Expiration

Every generated JWT must have an expiration time.

Example configuration:

```env
JWT_EXPIRES_IN=1d
```

JWT creation must explicitly set `expiresIn`.

Tokens without expiration must never be generated.

JWT verification must reject:

- Expired tokens
- Invalid signatures
- Malformed tokens

Authentication responses must not expose the JWT secret or signing configuration.

---

## 9. Safe Error Responses

Centralize error handling using the existing Express global error handler.

Expected client errors may return appropriate messages and status codes.

Unexpected server errors should return a generic response such as:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

Production responses must never expose:

- Stack traces
- SQL queries
- Prisma internals
- Environment variables
- JWT secrets
- Database credentials
- Internal filesystem paths

Detailed unexpected errors may be logged server-side while returning sanitized responses to clients.

---

## 10. Password Hash Protection

`passwordHash` must never be returned from API responses.

Prefer selecting only required fields from Prisma rather than retrieving the complete user record and deleting the password afterward.

Preferred approach:

```text
Database
   ↓
Explicit safe field selection
   ↓
Service
   ↓
Controller
   ↓
Response
```

Review all endpoints returning user information.

Check:

```text
login
signup
current user/profile
admin endpoints
student endpoints
mentor endpoints
```

No response should contain:

```text
password
passwordHash
```

---

## 11. Secret Protection

Verify `.gitignore` includes:

```text
.env
.env.*
!.env.example
```

Create `.env.example` containing variable names but never real secrets.

Example:

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
CLIENT_URL=
PORT=
NODE_ENV=
```

Verify that neither `JWT_SECRET` nor `DATABASE_URL` is present in tracked source files.

If a real credential was previously committed, removing it from the current file is insufficient. The credential must be rotated and repository history should be reviewed.

---

## 12. Middleware Order

Review the Express middleware pipeline.

Recommended structure:

```text
Request
   ↓
Helmet
   ↓
CORS
   ↓
Body parser
   ↓
Input normalization
   ↓
Global rate limiter
   ↓
Routes
      ↓
      Endpoint-specific limiter
      ↓
      Validation
      ↓
      Authentication
      ↓
      Authorization
      ↓
      Controller
      ↓
      Service
   ↓
404 handler
   ↓
Global error handler
```

Exact ordering may be adjusted where route-specific security requirements require it.

---

## 13. Security Review

Perform a final security review covering:

```text
[ ] Global API rate limiter enabled
[ ] Auth limiter enabled
[ ] Submission limiter enabled
[ ] Helmet enabled
[ ] CORS uses explicit allowed origins
[ ] Input strings normalized safely
[ ] Environment variables validated at startup
[ ] JWT tokens expire
[ ] Invalid/expired JWTs are rejected
[ ] Production errors are sanitized
[ ] passwordHash never appears in API responses
[ ] .env files are ignored
[ ] JWT_SECRET is not committed
[ ] DATABASE_URL is not committed
[ ] .env.example contains placeholders only
```

---

## Completion

Phase 17 is complete when all security controls are implemented, tested, and verified against the security checklist defined in `specs.md`.
