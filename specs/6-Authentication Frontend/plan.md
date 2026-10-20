# Phase 06 — Authentication Frontend

## Objective

Implement the frontend authentication experience for STUDENT and MENTOR users.

This phase covers login/signup UI, validation, authentication API integration, token management, current-user retrieval, logout, and role-based redirects. Protected routing belongs to Phase 07.

## Scope

Implement:

- `/login`
- `/signup`
- Login form
- Signup form
- Zod validation schemas
- React Hook Form integration
- Authentication API service
- Token management
- Current-user query
- Logout
- Role-based redirect after login

## Routes

```text
/login
/signup
```

## Redirect Rules

```text
STUDENT → /student/dashboard
MENTOR  → /mentor/dashboard
```

## Suggested Frontend Structure

```text
client/
├── app/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── components/auth/
│   ├── login-form.tsx
│   └── signup-form.tsx
├── lib/
│   ├── api/auth.ts
│   ├── auth/token.ts
│   └── validations/auth.ts
└── hooks/
    └── use-auth.ts
```

## Implementation Steps

### 1. Create authentication validation schemas

Create Zod schemas for:

#### Signup

```text
fullName
email
password
```

#### Login

```text
email
password
```

Frontend validation should align with backend expectations.

### 2. Build Signup Form

Use:

- React Hook Form
- Zod resolver
- ShadCN form components

Fields:

```text
Full Name
Email
Password
```

The form must provide field-level validation, pending state, server-error handling, and successful signup behavior.

### 3. Build Login Form

Use React Hook Form, Zod, and ShadCN components.

Fields:

```text
Email
Password
```

Provide validation messages, pending state, invalid-credential feedback, and successful-login handling.

### 4. Create Authentication API Service

Create reusable frontend functions for:

```http
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me
```

Responsibilities:

- Use configured backend base URL.
- Send JSON requests.
- Attach Bearer token when required.
- Parse standardized backend responses.
- Surface API errors cleanly.

Do not place ad hoc API calls directly inside page components.

### 5. Implement Token Management

Create a centralized token utility that can:

- Save token after login.
- Read token for authenticated requests.
- Remove token on logout.

### 6. Implement Current User Query

Use TanStack Query for:

```http
GET /api/auth/me
```

Recommended query key:

```ts
["currentUser"]
```

The query should run only when a token exists and expose loading/error state.

### 7. Implement Login Flow

```text
Submit form
  ↓
POST /api/auth/login
  ↓
Receive token + user
  ↓
Store token
  ↓
Update current-user state
  ↓
Read role
  ↓
Redirect
```

Redirect:

```text
STUDENT → /student/dashboard
MENTOR  → /mentor/dashboard
```

### 8. Implement Signup Flow

```text
Submit form
  ↓
POST /api/auth/signup
  ↓
Handle success
  ↓
Navigate to login or authenticated flow based on backend contract
```

If signup does not return a token, direct the user to `/login`.

### 9. Implement Logout

```text
Trigger logout
  ↓
Remove stored token
  ↓
Clear/invalidate auth query state
  ↓
Redirect to /login
```

### 10. Add Loading States

Show pending state for:

- Login submission
- Signup submission
- Current-user retrieval where relevant

Prevent duplicate submission while a request is active.

### 11. Add Error States

Display understandable errors for:

- Invalid credentials
- Duplicate email
- Invalid form input
- Network/backend failures

### 12. Connect Frontend to Backend

Use the configured frontend API environment variable, for example:

```env
NEXT_PUBLIC_API_URL=
```

### 13. Verify Role-Based Redirects

After successful login:

```text
STUDENT → /student/dashboard
MENTOR  → /mentor/dashboard
```

## UX Expectations

Authentication pages should:

- Label all inputs.
- Show validation messages near fields.
- Show loading state during requests.
- Disable duplicate submission.
- Display backend errors clearly.
- Allow navigation between login and signup.

## Out of Scope

Do not implement in Phase 06:

- Protected route middleware
- Student dashboard feature logic
- Mentor dashboard feature logic
- Submission form
- Review workflow
- Password reset
- Email verification
- Refresh tokens
- OAuth/social login

## Completion Criteria

Phase 06 is complete when:

- Student can register through UI.
- Student can login.
- Mentor can login.
- Invalid credentials show an error.
- Loading state is visible.
- Successful login redirects correctly.
- Token management works.
- Current-user query works.
- Logout clears authentication state.
- TypeScript/build checks pass.
