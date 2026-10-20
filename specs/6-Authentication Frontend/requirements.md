# Phase 06 — Requirements

## 1. Purpose

Phase 06 must implement frontend authentication for the existing backend auth APIs.

## 2. Route Requirements

### FE-AUTH-001 — Login Route

The frontend must expose:

```text
/login
```

### FE-AUTH-002 — Signup Route

The frontend must expose:

```text
/signup
```

## 3. Signup Requirements

### FE-AUTH-003 — Signup Form

The signup form must contain:

- Full name
- Email
- Password
- Submit action

### FE-AUTH-004 — Signup Validation

Signup input must use Zod integrated with React Hook Form.

### FE-AUTH-005 — Signup API Integration

The form must call:

```http
POST /api/auth/signup
```

through a reusable API service.

### FE-AUTH-006 — Signup Errors

The UI must display understandable errors for invalid fields, duplicate email, and request failure.

### FE-AUTH-007 — Signup Loading State

While signup is pending, duplicate submission must be prevented and a visible loading state shown.

## 4. Login Requirements

### FE-AUTH-008 — Login Form

The login form must contain:

- Email
- Password
- Submit action

### FE-AUTH-009 — Login Validation

Login input must use Zod and React Hook Form.

### FE-AUTH-010 — Login API Integration

The login form must call:

```http
POST /api/auth/login
```

through the shared authentication API service.

### FE-AUTH-011 — Invalid Credentials

Invalid credentials must produce a readable error without exposing raw server details.

### FE-AUTH-012 — Login Loading State

While login is pending, duplicate requests must be prevented and loading state shown.

## 5. Token Requirements

### FE-AUTH-013 — Token Persistence

The token returned after successful login must be persisted using the project's chosen token strategy.

### FE-AUTH-014 — Centralized Token Access

Token save/read/remove behavior must be centralized.

### FE-AUTH-015 — Authenticated Requests

Authenticated requests must send:

```http
Authorization: Bearer <token>
```

when a token is available.

## 6. Current User Requirements

### FE-AUTH-016 — Current User Endpoint

The frontend must call:

```http
GET /api/auth/me
```

### FE-AUTH-017 — TanStack Query

Current user data must be managed with TanStack Query.

Recommended key:

```ts
["currentUser"]
```

### FE-AUTH-018 — Conditional Query

The current-user query should not run when no token exists.

## 7. Redirect Requirements

### FE-AUTH-019 — Student Redirect

```text
STUDENT → /student/dashboard
```

### FE-AUTH-020 — Mentor Redirect

```text
MENTOR → /mentor/dashboard
```

### FE-AUTH-021 — Role Source

Redirects must use server-provided authenticated user role data, not a client-selected role.

## 8. Logout Requirements

### FE-AUTH-022 — Logout

Logout must:

1. Remove token.
2. Clear or invalidate auth state.
3. Redirect to `/login`.

## 9. Architecture Requirements

### FE-AUTH-023

Both forms must use React Hook Form.

### FE-AUTH-024

Both forms must use Zod.

### FE-AUTH-025

Forms should use existing ShadCN form components.

### FE-AUTH-026

Authentication calls must live in a reusable API module.

### FE-AUTH-027

Current-user server state must use TanStack Query.

### FE-AUTH-028

Frontend authentication code must use TypeScript and avoid unnecessary `any`.

## 10. Environment Requirements

Frontend API calls must use the configured backend URL, expected as:

```env
NEXT_PUBLIC_API_URL=
```

## 11. UX Requirements

- Inputs must have labels.
- Validation errors must be understandable.
- Loading state must be visible.
- Duplicate form submissions must be prevented.
- Navigation between login and signup must exist.

## 12. Security Requirements

- Frontend code must never expose password hashes.
- Redirects must rely on server-provided role data.
- Client auth state must never replace backend authorization.

## 13. Out of Scope

Phase 06 does not include:

- Route protection for `/student/*`
- Route protection for `/mentor/*`
- Backend auth implementation
- Mentor seed implementation
- Submission UI
- Mentor dashboard UI
- Refresh tokens
- Password reset
- Email verification

## 14. Acceptance Requirements

```text
[ ] /login exists
[ ] /signup exists
[ ] Login uses React Hook Form
[ ] Signup uses React Hook Form
[ ] Login uses Zod
[ ] Signup uses Zod
[ ] Signup calls POST /api/auth/signup
[ ] Login calls POST /api/auth/login
[ ] Current user calls GET /api/auth/me
[ ] Token management is centralized
[ ] Student can register through UI
[ ] Student can login
[ ] Mentor can login
[ ] Invalid credentials show error
[ ] Loading state is visible
[ ] STUDENT redirects to /student/dashboard
[ ] MENTOR redirects to /mentor/dashboard
[ ] Logout clears auth state
[ ] TypeScript checks pass
[ ] Production build passes
```
