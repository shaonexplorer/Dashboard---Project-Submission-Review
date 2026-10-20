# Phase 04 — Authentication Backend

## Objective

Implement secure backend authentication and authorization for STUDENT and MENTOR users using JWT-based authentication.

This phase covers only backend authentication. Frontend login/signup UI, mentor seeding, and protected frontend routing belong to later phases.

---

## Scope

Implement the following backend capabilities:

- Student signup
- User login
- JWT generation and verification
- Authentication middleware
- Role-based authorization middleware
- Current authenticated user endpoint

---

## Endpoints

### POST `/api/auth/signup`

Registers a new student account.

Expected flow:

```text
Request
  ↓
Validate input
  ↓
Normalize email
  ↓
Check duplicate email
  ↓
Hash password
  ↓
Create STUDENT user
  ↓
Return safe user data
```

Required fields:

- fullName
- email
- password

Important rules:

- Public signup creates only `STUDENT` users.
- Email must be normalized before persistence.
- Duplicate emails must be rejected.
- Password must be hashed before storage.
- Password hashes must never be included in API responses.

### POST `/api/auth/login`

Authenticates an existing user.

Expected flow:

```text
Request
  ↓
Validate input
  ↓
Find user by email
  ↓
Compare password
  ↓
Generate JWT
  ↓
Return token + safe user data
```

Login must support both STUDENT and MENTOR users. Mentor creation itself is outside this phase and belongs to the mentor seed phase.

### GET `/api/auth/me`

Returns the currently authenticated user.

Requirements:

- Requires a valid Bearer token.
- Reads the authenticated user identity from middleware.
- Returns safe user information only.

---

## Authentication Middleware

Create an `authenticate` middleware.

Responsibilities:

1. Read the `Authorization` header.
2. Confirm the Bearer token exists.
3. Verify the JWT.
4. Extract user ID and role.
5. Attach authenticated user information to the request.
6. Reject missing, invalid, or expired tokens.

Example header:

```http
Authorization: Bearer <token>
```

Expected failure status:

```text
401 Unauthorized
```

---

## Authorization Middleware

Create reusable middleware:

```ts
authorize(...roles)
```

Example usage:

```ts
authorize("STUDENT")
```

```ts
authorize("MENTOR")
```

Expected behavior:

- Authenticated users with an allowed role continue.
- Authenticated users with a disallowed role receive `403 Forbidden`.

---

## Suggested Backend Structure

```text
server/src/
├── controllers/
│   └── auth.controller.ts
├── services/
│   └── auth.service.ts
├── routes/
│   └── auth.routes.ts
├── middleware/
│   ├── authenticate.ts
│   └── authorize.ts
├── schemas/
│   └── auth.schema.ts
├── types/
│   └── express.d.ts
├── utils/
│   └── jwt.ts
└── config/
    └── env.ts
```

Exact filenames may vary as long as responsibilities remain clearly separated.

---

## Implementation Steps

### 1. Add Authentication Dependencies

Add the packages required for:

- Password hashing
- JWT signing and verification

Use matching TypeScript type packages when required.

### 2. Add Authentication Environment Configuration

Ensure backend environment configuration contains the JWT values required by the application.

At minimum:

```env
JWT_SECRET=
```

Secrets must never be committed to source control.

### 3. Create Authentication Validation Schemas

Create input validation schemas for:

- Signup
- Login

Signup validation should cover:

```text
fullName
email
password
```

Login validation should cover:

```text
email
password
```

Use the existing Phase 03 validation middleware instead of duplicating validation behavior.

### 4. Implement Password Hashing

Before creating a user:

- Hash the submitted password.
- Store only the hash in the database.

During login:

- Compare the submitted password against the stored hash.

Never expose the hash through controllers or API responses.

### 5. Implement Signup Service

The service should:

1. Normalize email.
2. Check whether the email already exists.
3. Reject duplicate email registration.
4. Hash the password.
5. Create the user with role `STUDENT`.
6. Return safe user data.

Do not allow the client to choose the account role during public signup.

### 6. Implement Signup Controller and Route

Create:

```http
POST /api/auth/signup
```

The controller should delegate business logic to the authentication service and use the existing standardized API response conventions.

### 7. Implement Login Service

The service should:

1. Normalize the submitted email.
2. Find the user.
3. Compare the password.
4. Reject invalid credentials.
5. Generate a JWT containing the required identity information.
6. Return the token and safe user data.

Do not reveal whether an email or password specifically caused login failure.

### 8. Implement Login Controller and Route

Create:

```http
POST /api/auth/login
```

Return:

- JWT access token
- Safe user data

Use the existing global error handling strategy.

### 9. Implement JWT Utility

Create reusable JWT helpers for:

- Signing tokens
- Verifying tokens

JWT payload must contain enough identity information for middleware to identify:

- user ID
- role

Token generation and verification must use the configured secret.

### 10. Extend Express Request Typing

Add TypeScript typing for authenticated request data.

The authenticated request should expose the user identity attached by the authentication middleware.

Avoid using `any` for authenticated request data.

### 11. Implement `authenticate`

Create middleware that:

- Reads the Authorization header.
- Validates Bearer format.
- Verifies the token.
- Extracts ID and role.
- Attaches authentication data to the request.
- Returns 401 for missing or invalid tokens.

### 12. Implement `authorize(...roles)`

Create reusable role authorization middleware.

It must:

- Read the authenticated role.
- Check it against the allowed roles.
- Return 403 when the user is authenticated but unauthorized.

Authentication and authorization must remain separate responsibilities.

### 13. Implement `/api/auth/me`

Create:

```http
GET /api/auth/me
```

Route protection order:

```text
authenticate
  ↓
controller
```

The endpoint should return the current authenticated user's safe data.

### 14. Integrate Auth Routes

Mount authentication routes under:

```text
/api/auth
```

The final endpoints should be:

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

---

## Out of Scope

Do not implement the following in Phase 04:

- Frontend login page
- Frontend signup page
- Frontend token storage
- Frontend route protection
- Mentor registration UI
- Mentor seed script
- Submission APIs
- Refresh token system
- Password reset
- OAuth/social login

---

## Completion Criteria

Phase 04 is complete when:

- Student can register.
- Student can login.
- An existing seeded mentor account can login once seed data is available.
- JWT is returned for valid login.
- Missing token is rejected.
- Invalid token returns `401`.
- Wrong role returns `403`.
- `/api/auth/me` returns the current authenticated user.
- Password hashes never appear in API responses.
- TypeScript and production build pass successfully.
