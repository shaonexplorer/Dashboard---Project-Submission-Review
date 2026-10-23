# Phase 17 — Security Validation Checklist

## Purpose

This document defines the validation process required before Phase 17 can be considered complete.

---

## 1. Global Rate Limiter

### Test

Send requests repeatedly to a normal API endpoint until the configured global limit is exceeded.

### Expected

Before limit:

```text
2xx / expected endpoint status
```

After limit:

```text
429 Too Many Requests
```

### Verify

```text
[ ] Global limiter applies to intended API routes
[ ] HTTP 429 is returned when exceeded
[ ] Rate-limit headers are present
[ ] Response does not expose internal details
```

---

## 2. Authentication Rate Limiter

### Test

Repeatedly call:

```text
POST /auth/login
```

with invalid credentials.

Repeat against signup if signup is covered by the authentication limiter.

### Expected

After the configured threshold:

```text
429 Too Many Requests
```

### Verify

```text
[ ] Login limiter works
[ ] Signup limiter works
[ ] Auth limit is stricter than general API limit
[ ] Brute-force attempts are throttled
```

---

## 3. Submission Rate Limiter

### Test

Repeatedly call:

```text
POST /submissions
```

until the submission threshold is exceeded.

### Expected

```text
429 Too Many Requests
```

### Verify

```text
[ ] Submission limiter works
[ ] Other unrelated endpoints are unaffected by the submission-specific limit
[ ] Duplicate-submission validation still works
```

---

## 4. Helmet Validation

Inspect API response headers.

### Verify

```text
[ ] Helmet middleware is active
[ ] Security headers are returned
[ ] X-Powered-By is not exposed
[ ] API functionality remains operational
```

Do not require a specific header solely because Helmet historically enabled it; validate against the actual Helmet configuration used by the project.

---

## 5. CORS Validation

### Allowed Origin

Send a request using the configured frontend origin.

Expected:

```text
Request accepted
Appropriate Access-Control-Allow-Origin header returned
```

### Unauthorized Origin

Send the same request using an unknown origin.

Example:

```text
https://malicious-example.test
```

Expected:

```text
Origin is not granted CORS access
```

### Verify

```text
[ ] Trusted frontend origin works
[ ] Unknown origin is rejected/not granted CORS permission
[ ] Wildcard origin is not used for authenticated endpoints
[ ] Required methods are configured
[ ] Required headers are configured
[ ] Credentials configuration matches the authentication design
```

---

## 6. Input Trimming Validation

Submit values containing surrounding whitespace.

Example:

```json
{
  "projectName": "   My Project   ",
  "repoUrl": "   https://github.com/example/project   "
}
```

### Expected

Application processes normalized values equivalent to:

```json
{
  "projectName": "My Project",
  "repoUrl": "https://github.com/example/project"
}
```

### Verify

```text
[ ] Project name is trimmed
[ ] Email is trimmed where applicable
[ ] Repository URL is trimmed
[ ] Live URL is trimmed
[ ] Description is normalized according to project rules
[ ] Password values are not automatically trimmed
```

---

## 7. Environment Validation

### Missing JWT Secret

Temporarily start the application without:

```text
JWT_SECRET
```

Expected:

```text
Application fails during startup
```

### Missing Database URL

Start without:

```text
DATABASE_URL
```

Expected:

```text
Application fails during startup
```

### Invalid Configuration

Provide invalid values for validated environment settings.

Expected:

```text
Application fails fast with a configuration error
```

### Verify

```text
[ ] Required environment variables are validated
[ ] Validation occurs during startup
[ ] Application does not continue with invalid configuration
[ ] Runtime code consumes validated configuration
```

---

## 8. JWT Expiration Validation

Decode a generated access token.

### Verify

JWT payload contains:

```text
iat
exp
```

Then test:

```text
Valid token   → protected endpoint succeeds
Expired token → protected endpoint returns 401
Invalid token → protected endpoint returns 401
```

### Checklist

```text
[ ] Every generated JWT expires
[ ] Expiration is configurable
[ ] Expired JWTs are rejected
[ ] Invalid signatures are rejected
[ ] Malformed tokens are rejected
```

---

## 9. Safe Error Response Validation

Trigger an unexpected server-side error in a controlled development/test environment.

### Expected Production Response

```json
{
  "success": false,
  "message": "Internal server error"
}
```

### Response MUST NOT contain

```text
stack
PrismaClient
DATABASE_URL
JWT_SECRET
SQL query
database password
filesystem path
internal implementation details
```

### Verify

```text
[ ] Unexpected errors return generic responses
[ ] Stack traces are not returned in production
[ ] Database internals are hidden
[ ] Secrets are never returned
[ ] Global error handler handles unexpected errors
```

---

## 10. passwordHash Validation

Inspect responses from all endpoints that return user data.

At minimum test:

```text
signup
login
current user
profile
mentor/admin user-related endpoints
submission responses containing user relations
```

Search returned JSON recursively for:

```text
password
passwordHash
```

### Expected

```text
passwordHash MUST NOT exist
```

### Preferred Database Review

Inspect Prisma queries returning users.

Prefer:

```ts
select: {
  id: true,
  email: true,
  role: true
}
```

over unrestricted user objects when only safe fields are required.

### Verify

```text
[ ] Signup does not expose passwordHash
[ ] Login does not expose passwordHash
[ ] Profile does not expose passwordHash
[ ] Nested user relations do not expose passwordHash
[ ] Admin/mentor endpoints do not expose passwordHash
```

---

## 11. Secret Repository Validation

Check tracked files for sensitive values.

Useful Git checks include:

```bash
git ls-files | grep -E '(^|/)\.env($|\.)'
```

and searches for secret/configuration identifiers:

```bash
git grep -n "JWT_SECRET"
git grep -n "DATABASE_URL"
```

Finding identifiers in `.env.example` or environment-loading code is acceptable.

Finding real secret values is not.

### Verify

```text
[ ] .env is ignored
[ ] Production environment files are ignored
[ ] .env.example contains placeholders only
[ ] Real JWT_SECRET is not committed
[ ] Real DATABASE_URL is not committed
```

---

## 12. Git History Review

Current working-tree checks alone do not prove that secrets were never committed.

Review repository history if real credentials may previously have been added.

If a secret was committed:

```text
1. Treat the credential as compromised
2. Rotate/revoke the credential
3. Replace the application configuration
4. Remove sensitive data from repository history when appropriate
```

### Verify

```text
[ ] No known active secrets exist in Git history
[ ] Any previously exposed credentials have been rotated
```

---

## 13. Regression Validation

Security middleware must not break legitimate functionality.

Re-test:

```text
[ ] Student signup
[ ] Login
[ ] JWT authentication
[ ] Role-based authorization
[ ] Project submission
[ ] Duplicate submission prevention
[ ] Mentor dashboard
[ ] Server-side pagination
[ ] Approved filter
[ ] Rejected filter
[ ] Approve action
[ ] Reject action
[ ] Aggregated statistics
```

---

# Final Security Gate

Phase 17 MUST NOT be marked complete until all critical checks pass.

```text
RATE LIMITING
[ ] Global limiter
[ ] Auth limiter
[ ] Submission limiter

HTTP SECURITY
[ ] Helmet
[ ] Strict CORS

INPUT SECURITY
[ ] Input trimming
[ ] Existing schema validation preserved

CONFIGURATION
[ ] Environment validation
[ ] JWT_SECRET protected
[ ] DATABASE_URL protected
[ ] .env ignored

AUTHENTICATION
[ ] JWT expiration
[ ] Expired tokens rejected
[ ] Invalid tokens rejected

DATA PROTECTION
[ ] passwordHash never returned
[ ] Raw passwords never returned/logged

ERROR HANDLING
[ ] Safe production errors
[ ] No stack traces exposed
[ ] No database internals exposed
[ ] No secrets exposed

REGRESSION
[ ] Existing application functionality passes
```

## Completion Decision

```text
All critical checks pass
        ↓
Security checklist in specs.md satisfied
        ↓
Phase 17 COMPLETE
```
