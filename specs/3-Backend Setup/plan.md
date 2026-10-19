# Phase 03 — Backend Foundation

## Objective

Establish a reusable, maintainable backend architecture before implementing authentication or feature-specific APIs.

This phase builds on the Phase 01 Express/TypeScript setup and the Phase 02 PostgreSQL/Prisma setup. The goal is to prepare the server so later phases can add authentication, submissions, mentor workflows, and other features without duplicating core infrastructure.

## Scope

Phase 03 includes:

- Backend folder structure
- Environment configuration
- Prisma client singleton
- Standard API response convention
- Custom API error class
- Async error-handling strategy
- Global error middleware
- 404 middleware
- Request validation middleware
- Shared backend utility/type organization

Phase 03 does **not** include:

- Signup or login endpoints
- JWT authentication
- Role-based authorization
- Mentor seeding
- Submission APIs
- Mentor dashboard APIs
- Review actions

---

## Target Backend Structure

```text
server/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── prisma.ts
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   ├── not-found.middleware.ts
│   │   └── validate.middleware.ts
│   ├── schemas/
│   ├── utils/
│   │   ├── api-error.ts
│   │   └── api-response.ts
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

Names may vary slightly, but responsibilities should remain separated.

---

## Implementation Plan

### Step 1 — Create Backend Directories

Create the reusable backend directories:

```text
config/
controllers/
services/
routes/
middleware/
schemas/
utils/
types/
```

Keep `app.ts` responsible for Express application configuration and `server.ts` responsible for starting the HTTP server.

---

### Step 2 — Centralize Environment Configuration

Create an environment configuration module such as:

```text
src/config/env.ts
```

The module should read required environment variables and expose them through one centralized object.

Example variables already relevant to the project:

```env
PORT=5000
DATABASE_URL=
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

Do not introduce authentication-specific variables such as `JWT_SECRET` as a Phase 03 requirement unless they already exist for later preparation.

The rest of the application should avoid repeatedly reading directly from `process.env` when a centralized configuration value is available.

---

### Step 3 — Create Prisma Client Singleton

Create:

```text
src/config/prisma.ts
```

Instantiate and export one reusable `PrismaClient` instance.

Example responsibility:

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

If the current Prisma version/project setup requires a generated client import path, use the path established in Phase 02.

The important requirement is that application modules reuse the same configured Prisma client rather than creating a new client for every request or service.

---

### Step 4 — Define Standard API Response Convention

Create a reusable API response format.

Successful responses should follow a predictable structure such as:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Error responses should follow a predictable structure such as:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

Optional metadata such as pagination may be added later where required.

Create a utility/type if useful, for example:

```text
src/utils/api-response.ts
```

The main goal is consistency across future endpoints.

---

### Step 5 — Create Custom API Error Class

Create:

```text
src/utils/api-error.ts
```

The error class should extend JavaScript's `Error` class and carry an HTTP status code.

Example API:

```ts
throw new ApiError(404, "Resource not found");
```

Recommended properties:

```text
statusCode
message
```

Optional properties may include:

```text
errors
isOperational
```

Do not over-engineer the class beyond what later phases need.

---

### Step 6 — Establish Async Error Handling

Choose one consistent strategy for errors thrown from async route handlers.

Possible approach:

```ts
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

Store the helper under `utils/` or another clearly named shared location.

The requirement is that asynchronous controller/service errors reach the global error middleware instead of requiring repeated local `try/catch` blocks everywhere.

---

### Step 7 — Add Global Error Middleware

Create:

```text
src/middleware/error.middleware.ts
```

The middleware should:

1. Receive errors passed through `next(error)`.
2. Determine an HTTP status code.
3. Produce the project's standard error response.
4. Avoid leaking unnecessary internals to clients.
5. Return a safe default for unexpected errors.

Example response:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

Unexpected errors should generally resolve to:

```http
500 Internal Server Error
```

with an appropriate safe message.

---

### Step 8 — Add 404 Middleware

Create:

```text
src/middleware/not-found.middleware.ts
```

When no route matches a request, return or forward a `404` error.

Example response:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

Register this middleware after all application routes and before the global error handler if the 404 handler forwards an error.

---

### Step 9 — Add Validation Middleware

Create:

```text
src/middleware/validate.middleware.ts
```

The middleware should support reusable schema-based request validation for future routes.

Validation may target:

```text
body
query
params
```

The project already uses Zod on the frontend; a Zod-based backend validation approach may also be used if that matches the server dependencies.

The middleware should forward validation failures through the standard backend error-handling flow.

No authentication or submission schemas need to be implemented in this phase.

---

### Step 10 — Organize Controllers, Services, Routes, and Schemas

Define clear responsibilities before feature development begins.

#### Controllers

Controllers should handle HTTP-layer concerns:

```text
request input
service invocation
HTTP response
```

Controllers should avoid containing large database/business logic blocks.

#### Services

Services should contain:

```text
business logic
database operations
reusable feature logic
```

#### Routes

Routes should declare:

```text
HTTP method
path
middleware chain
controller
```

#### Schemas

Schemas should contain reusable request validation definitions.

This separation should be preserved when later phases add authentication and submissions.

---

### Step 11 — Integrate Foundation Middleware in `app.ts`

Update `src/app.ts` so application middleware is registered in a predictable order.

Example order:

```text
Express application
↓
Security / CORS / JSON middleware from Phase 01
↓
Application routes
↓
404 middleware
↓
Global error middleware
```

Keep the Phase 01 health endpoint operational.

---

### Step 12 — Keep `server.ts` Focused on Startup

`server.ts` should remain responsible for:

```text
loading configuration
starting the Express server
logging startup state
```

It should not contain feature routes or business logic.

Optional graceful Prisma disconnect/shutdown handling may be added if desired, but it should remain simple.

---

### Step 13 — Verify Existing Health Endpoint

Confirm that:

```http
GET /api/health
```

still returns a successful response after the backend restructuring.

Expected baseline:

```json
{
  "success": true,
  "message": "Server is running"
}
```

---

### Step 14 — Verify 404 Handling

Call a nonexistent route such as:

```http
GET /api/does-not-exist
```

Expected status:

```http
404 Not Found
```

Expected response structure:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

---

### Step 15 — Verify Global Error Handling

Temporarily trigger or test an application error and confirm that the response:

- has the expected HTTP status
- uses the standard error structure
- does not expose an uncontrolled stack trace to the client

Remove temporary error routes after testing.

---

### Step 16 — Run Quality Checks

Run the project's available checks, for example:

```bash
npm run dev
npm run build
npm run lint
```

If the backend has a dedicated TypeScript check script, run it as well.

Resolve TypeScript and import errors before declaring Phase 03 complete.

---

## Expected Deliverables

By the end of Phase 03, the backend should contain:

```text
src/config/
src/controllers/
src/services/
src/routes/
src/middleware/
src/schemas/
src/utils/
src/types/
src/app.ts
src/server.ts
```

and reusable implementations for:

```text
Prisma client
environment configuration
async error handling
custom API errors
global error middleware
404 handling
request validation
standard API responses
```

---

## Completion Criteria

Phase 03 is complete when:

- The backend follows the planned reusable folder architecture.
- A shared Prisma client is available.
- Environment configuration is centralized.
- Async errors are forwarded consistently.
- A custom API error mechanism exists.
- Unmatched routes produce a standardized 404 response.
- The global error middleware returns consistent responses.
- Validation middleware is ready for future request schemas.
- Existing backend startup and health checks still work.
- TypeScript/build checks pass.

The defining roadmap criterion is:

```text
Backend errors return consistent responses.
```

