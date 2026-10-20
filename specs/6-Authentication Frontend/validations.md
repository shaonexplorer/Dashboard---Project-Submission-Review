# Phase 06 — Validations

## Purpose

This document defines the validation checks for Phase 06 — Authentication Frontend.

# 1. Route Validation

## VAL-001 — Login Route

Open:

```text
/login
```

Expected:

- Page loads.
- Login form is visible.
- No runtime error occurs.

## VAL-002 — Signup Route

Open:

```text
/signup
```

Expected:

- Page loads.
- Signup form is visible.
- No runtime error occurs.

# 2. Login Form Validation

## VAL-003 — Required Email

Submit without email.

Expected:

```text
Validation error displayed
No API request sent
```

## VAL-004 — Invalid Email

Enter malformed email.

Expected:

```text
Validation error displayed
```

## VAL-005 — Required Password

Submit without password.

Expected:

```text
Validation error displayed
No API request sent
```

## VAL-006 — React Hook Form

Verify login form state/submission uses React Hook Form.

## VAL-007 — Zod

Verify login validation is driven by Zod.

# 3. Signup Form Validation

## VAL-008 — Required Full Name

Submit without full name.

Expected validation failure.

## VAL-009 — Required Email

Submit without email.

Expected validation failure.

## VAL-010 — Invalid Email

Enter malformed email.

Expected validation failure.

## VAL-011 — Required Password

Submit without password.

Expected validation failure.

## VAL-012 — React Hook Form

Verify signup uses React Hook Form.

## VAL-013 — Zod

Verify signup validation uses Zod.

# 4. Signup API Validation

## VAL-014 — Valid Student Signup

Submit valid data.

Expected request:

```http
POST /api/auth/signup
```

Expected:

- Request succeeds.
- Success behavior is shown.
- User moves to correct next step.

## VAL-015 — Duplicate Email

Attempt signup using an existing email.

Expected:

- Conflict is surfaced.
- Readable message is displayed.
- Raw server details are not shown.

## VAL-016 — Signup Loading State

Expected:

- Loading state is visible.
- Duplicate requests are prevented.

# 5. Login API Validation

## VAL-017 — Valid Student Login

Expected:

- `POST /api/auth/login` succeeds.
- Token is stored.
- Role is recognized.
- Redirect goes to `/student/dashboard`.

## VAL-018 — Valid Mentor Login

Expected:

- Login succeeds.
- Token is stored.
- Redirect goes to `/mentor/dashboard`.

## VAL-019 — Invalid Credentials

Expected:

- Login fails.
- User remains on login page.
- Readable error is shown.
- No token is stored.

## VAL-020 — Login Loading State

Expected:

- Loading state is visible.
- Duplicate requests are prevented.

# 6. Token Validation

## VAL-021 — Token Storage

After successful login, verify token can be retrieved for authenticated requests.

## VAL-022 — Centralized Token Management

Verify page components do not duplicate token storage logic.

## VAL-023 — Authorization Header

Trigger:

```http
GET /api/auth/me
```

Expected header:

```http
Authorization: Bearer <token>
```

# 7. Current User Query Validation

## VAL-024 — TanStack Query

Verify current-user data uses TanStack Query.

## VAL-025 — Stable Query Key

Verify a stable key such as:

```ts
["currentUser"]
```

## VAL-026 — No Token Behavior

With no token, `/api/auth/me` should not be unnecessarily requested.

## VAL-027 — Valid Current User

With a valid token:

- User data loads.
- Role is available.
- Sensitive password data is absent from frontend models.

# 8. Redirect Validation

## VAL-028 — Student Redirect

```text
STUDENT → /student/dashboard
```

## VAL-029 — Mentor Redirect

```text
MENTOR → /mentor/dashboard
```

## VAL-030 — Trusted Role Source

Verify redirect role comes from authenticated backend data.

# 9. Logout Validation

## VAL-031 — Token Removal

Expected:

```text
Stored token removed
```

## VAL-032 — Auth State Cleanup

Expected:

- Current-user state is cleared or invalidated.
- Stale user data is not retained.

## VAL-033 — Logout Redirect

Expected:

```text
/login
```

# 10. Error UX Validation

## VAL-034 — Network Failure

Expected:

- Readable error shown.
- Page remains usable.
- Raw exception details are hidden.

## VAL-035 — Backend Validation Error

Expected:

- Error is surfaced clearly.
- Form remains usable.

# 11. Environment Validation

## VAL-036 — API Base URL

Verify requests use:

```env
NEXT_PUBLIC_API_URL=
```

or the project's established equivalent.

# 12. Navigation Validation

## VAL-037 — Login to Signup

Verify navigation from `/login` to `/signup`.

## VAL-038 — Signup to Login

Verify navigation from `/signup` to `/login`.

# 13. Accessibility Validation

## VAL-039 — Labels

Verify all auth inputs have labels.

## VAL-040 — Error Association

Validation messages should clearly relate to their fields.

## VAL-041 — Keyboard Use

Verify forms can be completed using keyboard interaction.

# 14. Scope Validation

## VAL-042 — Protected Routing Excluded

Verify Phase 06 does not depend on Phase 07 protected routing implementation.

# 15. TypeScript and Build Validation

## VAL-043 — TypeScript Check

Expected:

```text
0 TypeScript errors
```

## VAL-044 — Production Build

Expected:

```text
Build succeeds
```

# 16. Regression Validation

## VAL-045 — Frontend Still Runs

Expected:

```text
Application loads normally
```

## VAL-046 — Backend Connectivity

Verify frontend-to-backend communication still works.

# 17. Phase Completion Checklist

```text
[ ] /login loads
[ ] /signup loads
[ ] Login uses React Hook Form
[ ] Signup uses React Hook Form
[ ] Login uses Zod validation
[ ] Signup uses Zod validation
[ ] Student signup works through UI
[ ] Duplicate signup error is displayed
[ ] Student login works
[ ] Mentor login works
[ ] Invalid credentials show readable error
[ ] Login loading state is visible
[ ] Signup loading state is visible
[ ] Token is stored after login
[ ] Token management is centralized
[ ] Authenticated requests send Bearer token
[ ] Current-user query uses TanStack Query
[ ] Current-user query works with valid token
[ ] STUDENT redirects to /student/dashboard
[ ] MENTOR redirects to /mentor/dashboard
[ ] Logout removes token
[ ] Logout clears auth state
[ ] Logout redirects to /login
[ ] NEXT_PUBLIC_API_URL is used
[ ] TypeScript checks pass
[ ] Production build passes
```
