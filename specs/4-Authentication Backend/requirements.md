# Phase 04 — Requirements

## 1. Purpose

Phase 04 must implement backend authentication and role-based authorization for the project.

The backend must support STUDENT signup and authentication for both STUDENT and MENTOR accounts.

---

## 2. Functional Requirements

### AUTH-001 — Student Signup Endpoint

The backend must expose:

```http
POST /api/auth/signup
```

The endpoint must create a new user with role:

```text
STUDENT
```

Public signup must not allow clients to assign themselves another role.

### AUTH-002 — Signup Input

Signup must accept and validate:

- fullName
- email
- password

Invalid input must be rejected before account creation.

### AUTH-003 — Email Normalization

The backend must normalize email before duplicate lookup, user creation, and login lookup.

### AUTH-004 — Duplicate Email Protection

The backend must reject signup when the normalized email already exists.

The database unique constraint must remain the final integrity safeguard.

### AUTH-005 — Password Hashing

Plaintext passwords must never be stored.

Before persistence, passwords must be hashed using the project's selected password hashing library.

### AUTH-006 — Safe Signup Response

Signup responses must not include:

```text
password
passwordHash
```

Only safe user properties may be returned.

### AUTH-007 — Login Endpoint

The backend must expose:

```http
POST /api/auth/login
```

The endpoint must authenticate existing users.

### AUTH-008 — Login Input

Login must accept and validate:

- email
- password

### AUTH-009 — Credential Verification

Login must:

1. Find the normalized email.
2. Compare the submitted password against the stored hash.
3. Reject invalid credentials.
4. Generate a JWT for valid credentials.

### AUTH-010 — Generic Invalid Credential Error

Login failures must not reveal whether the user does not exist or the password is incorrect.

### AUTH-011 — JWT Generation

A successful login must return a JWT.

The token must contain enough information to identify:

- user ID
- user role

JWT signing must use the configured backend secret.

### AUTH-012 — Login Response

Successful login must return:

- token
- safe user data

Sensitive database fields must not be returned.

### AUTH-013 — Authentication Middleware

The backend must provide reusable middleware named or equivalent to:

```text
authenticate
```

It must:

- read the Authorization header
- enforce Bearer token format
- verify JWT validity
- extract authenticated identity
- attach authentication data to the request

### AUTH-014 — Missing Token

Protected endpoints must reject requests without a token using:

```http
401 Unauthorized
```

### AUTH-015 — Invalid Token

Protected endpoints must reject invalid or unverifiable JWTs using:

```http
401 Unauthorized
```

### AUTH-016 — Authorization Middleware

The backend must provide reusable role authorization middleware equivalent to:

```ts
authorize(...roles)
```

### AUTH-017 — Wrong Role

An authenticated user attempting to access a route outside their allowed role must receive:

```http
403 Forbidden
```

### AUTH-018 — Current User Endpoint

The backend must expose:

```http
GET /api/auth/me
```

The endpoint must require authentication and return the current user's safe account data.

---

## 3. Technical Requirements

### TECH-001 — TypeScript

All authentication implementation must use TypeScript.

Avoid untyped authentication payloads and request augmentation.

### TECH-002 — Existing Architecture

Authentication must integrate with the Phase 03 backend architecture.

Use existing:

- controllers
- services
- routes
- middleware
- schemas
- utilities
- global error handling
- response conventions

Do not introduce a parallel architecture.

### TECH-003 — Service Separation

Database and authentication business logic should live in the service layer.

Controllers should primarily handle HTTP concerns.

### TECH-004 — Centralized JWT Utilities

JWT signing and verification logic should be implemented through reusable utility functions or a centralized authentication utility.

### TECH-005 — Request Typing

Authenticated user information attached to Express requests must have explicit TypeScript typing.

### TECH-006 — Prisma Usage

Authentication services must use the existing Prisma client/singleton introduced in the backend foundation.

Do not create a new Prisma client for every request.

### TECH-007 — Validation Reuse

Authentication routes must use the validation system established in Phase 03.

### TECH-008 — Error Handling Reuse

Authentication errors must flow through the established global error handling strategy.

---

## 4. Environment Requirements

The backend must have a JWT signing secret available through environment configuration.

Required:

```env
JWT_SECRET=
```

The secret must:

- not be hard-coded
- not be committed to Git
- be read through centralized environment configuration

---

## 5. Security Requirements

### SEC-001

Passwords must only be stored as hashes.

### SEC-002

Password hashes must never be included in API responses.

### SEC-003

JWT secrets must never be exposed to clients.

### SEC-004

Authentication errors must avoid leaking unnecessary account information.

### SEC-005

Public signup must always assign the STUDENT role server-side.

### SEC-006

Authorization must be enforced on the backend even if frontend role protection is added later.

---

## 6. API Requirements

Required routes:

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

Expected authentication header for protected requests:

```http
Authorization: Bearer <token>
```

Expected status behavior:

```text
200/201  successful authentication operation
400      invalid request input
401      missing/invalid authentication
403      authenticated but unauthorized
409      duplicate account conflict
```

Exact success status codes may follow the project's existing response convention.

---

## 7. Role Requirements

The authentication system must recognize the existing roles:

```text
STUDENT
MENTOR
```

Signup must create:

```text
STUDENT
```

The login system must be capable of authenticating either role.

---

## 8. Out-of-Scope Requirements

Phase 04 must not require implementation of:

- frontend authentication screens
- frontend route guards
- mentor public signup
- mentor seed implementation
- refresh tokens
- forgot-password flow
- password reset
- email verification
- OAuth
- submission functionality

---

## 9. Acceptance Requirements

Phase 04 is accepted only when all of the following are true:

```text
[ ] Student signup works
[ ] Duplicate email is rejected
[ ] Password is hashed before storage
[ ] Student login works
[ ] Existing mentor credentials can be authenticated
[ ] Valid login returns JWT
[ ] Safe user data is returned
[ ] passwordHash never appears in responses
[ ] Missing token returns 401
[ ] Invalid token returns 401
[ ] Wrong role returns 403
[ ] authenticate middleware is reusable
[ ] authorize(...roles) middleware is reusable
[ ] GET /api/auth/me works
[ ] TypeScript check passes
[ ] Production build passes
```
