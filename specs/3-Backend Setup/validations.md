# Phase 03 — Backend Foundation Validations

## Purpose

Validate that Phase 03 provides a stable, reusable backend foundation before authentication and feature APIs are implemented.

---

## 1. Folder Structure Validation

Confirm the backend contains the expected architectural directories.

Expected baseline:

```text
server/src/
├── config/
├── controllers/
├── services/
├── routes/
├── middleware/
├── schemas/
├── utils/
├── types/
├── app.ts
└── server.ts
```

### Pass Condition

- Each required responsibility has a clear directory/location.
- `app.ts` and `server.ts` still exist.

### Fail Condition

- Most backend logic remains concentrated in one file.
- There is no separation for services, middleware, schemas, or utilities.

---

## 2. `app.ts` / `server.ts` Separation Validation

Inspect both files.

### `app.ts` should manage

```text
Express app creation
middleware registration
routes
404 middleware
global error middleware
```

### `server.ts` should manage

```text
application startup
port binding
startup logging
```

### Pass Condition

Feature/business logic is not directly implemented in `server.ts`.

---

## 3. Environment Configuration Validation

Confirm the project has a centralized environment/config module.

Example:

```text
src/config/env.ts
```

Check that existing values such as the following can be resolved:

```text
PORT
DATABASE_URL
CLIENT_URL
NODE_ENV
```

### Validation Checks

- Start the server with the normal `.env` file.
- Confirm configured port/environment values are read correctly.
- Confirm the application does not require repeated direct `process.env` access throughout unrelated modules.

### Pass Condition

Environment configuration loads predictably and server startup succeeds.

---

## 4. Prisma Client Validation

Confirm a centralized Prisma module exists.

Expected example:

```text
src/config/prisma.ts
```

Verify the module exports a reusable Prisma client.

### Pass Condition

A service can import the shared Prisma client without creating another `PrismaClient` instance.

### Fail Condition

Every request, controller, or service creates its own new Prisma client instance.

---

## 5. Backend Startup Validation

Run the backend development command.

Example:

```bash
npm run dev
```

### Pass Condition

- Server starts without TypeScript/import errors.
- Expected port is used.
- No Prisma configuration/import error blocks startup.

---

## 6. Health Endpoint Regression Validation

Request:

```http
GET /api/health
```

Example with cURL:

```bash
curl http://localhost:5000/api/health
```

Expected status:

```http
200 OK
```

Expected baseline body:

```json
{
  "success": true,
  "message": "Server is running"
}
```

### Pass Condition

The Phase 03 restructuring has not broken the Phase 01 health endpoint.

---

## 7. Standard Error Response Validation

Trigger a known application error through a temporary development-only route or automated test.

Example expected response shape:

```json
{
  "success": false,
  "message": "Example error"
}
```

### Validate

- `success` is `false`.
- A readable `message` is present.
- HTTP status matches the error.
- Response does not contain an uncontrolled stack trace.

Remove any temporary testing route afterward.

---

## 8. Custom `ApiError` Validation

Create or use a temporary test path that throws something equivalent to:

```ts
throw new ApiError(400, "Invalid request");
```

Expected status:

```http
400 Bad Request
```

Expected body:

```json
{
  "success": false,
  "message": "Invalid request"
}
```

### Pass Condition

The global error middleware recognizes the custom error and preserves its intended status/message.

---

## 9. Async Error Handling Validation

Create a temporary async handler that throws/rejects.

Conceptual test:

```ts
async () => {
  throw new ApiError(400, "Async failure");
}
```

### Validate

- The request does not hang.
- The process does not crash because of an unhandled route promise.
- The error reaches the global error middleware.
- The expected error response is returned.

### Pass Condition

Async errors can be handled without a local `try/catch` block in every controller.

---

## 10. 404 Middleware Validation

Request an endpoint that does not exist.

```bash
curl -i http://localhost:5000/api/does-not-exist
```

Expected status:

```http
404 Not Found
```

Expected response:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

The exact message may vary if the project defines another consistent 404 message.

### Pass Condition

Unknown routes always return the project's standard error format.

---

## 11. Middleware Ordering Validation

Inspect `app.ts`.

Verify this general ordering:

```text
core/security/body middleware
↓
valid routes
↓
404 middleware
↓
global error middleware
```

### Functional Check

Call `/api/health`.

It must return `200`, not be intercepted by the 404 handler.

Call an unknown route.

It must return `404` through the intended error flow.

---

## 12. Validation Middleware — Body Validation

Use a temporary schema/test route if no feature schema exists yet.

Send invalid JSON data that violates the schema.

Expected behavior:

- request is rejected before controller/business logic runs
- response uses an appropriate `4xx` status
- response follows the standard error convention

### Pass Condition

Reusable body validation works independently of feature-specific controllers.

---

## 13. Validation Middleware — Query Validation

If the validation middleware is designed to support query validation, test a temporary schema against `req.query`.

### Pass Condition

Invalid query values are rejected predictably before controller execution.

If Phase 03 implementation intentionally provides a generic source selector rather than dedicated query tests, verify the middleware API clearly supports query validation.

---

## 14. Validation Middleware — Params Validation

If the middleware supports route parameters, test an invalid route parameter using a temporary route/schema.

### Pass Condition

Invalid params are rejected through the same validation/error pipeline.

---

## 15. Controller/Service Separation Validation

Inspect any current example route or the health implementation if it has been refactored.

Check that the architecture allows future flow such as:

```text
Route
↓
Validation middleware
↓
Controller
↓
Service
↓
Prisma
```

### Pass Condition

There is a clear location for each layer, and future business logic does not need to be placed directly in route files.

---

## 16. Sensitive Error Information Validation

Trigger an unexpected server-side error in a controlled development test.

Inspect the client response.

It must not expose confidential values such as:

```text
DATABASE_URL
passwords
secret environment values
internal credentials
```

### Pass Condition

Client response is safe while useful debugging information can still be logged server-side in development.

---

## 17. TypeScript Validation

Run the project's TypeScript/build command.

Examples:

```bash
npm run build
```

or, if configured:

```bash
npm run typecheck
```

### Validate

- Express middleware signatures compile.
- Custom error types compile.
- Prisma imports compile.
- Environment configuration imports compile.
- No unresolved module paths remain.

### Pass Condition

TypeScript validation succeeds without errors introduced by Phase 03.

---

## 18. Lint Validation

If linting is configured, run:

```bash
npm run lint
```

### Pass Condition

No blocking lint errors remain from Phase 03 files.

---

## 19. Production Build Validation

Run the backend's production build script.

Example:

```bash
npm run build
```

Then, if configured, start the compiled server using the production/start script.

### Pass Condition

The compiled backend starts correctly and `/api/health` remains reachable.

---

## 20. Scope Validation

Inspect Phase 03 implementation for out-of-scope work.

The following are **not required yet**:

```text
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me
JWT middleware
role authorization
mentor seed
submission endpoints
mentor listing endpoints
review endpoints
```

### Pass Condition

Phase 03 remains focused on reusable backend architecture rather than implementing later roadmap phases.

---

## 21. Final Phase 03 Checklist

### Architecture

- [ ] `config/` exists.
- [ ] `controllers/` exists.
- [ ] `services/` exists.
- [ ] `routes/` exists.
- [ ] `middleware/` exists.
- [ ] `schemas/` exists.
- [ ] `utils/` exists.
- [ ] `types/` exists.
- [ ] `app.ts` and `server.ts` have distinct responsibilities.

### Infrastructure

- [ ] Shared Prisma client works.
- [ ] Environment configuration works.
- [ ] Async error helper/strategy works.
- [ ] Custom API error works.
- [ ] Global error middleware works.
- [ ] 404 middleware works.
- [ ] Validation middleware is reusable.
- [ ] Standard API response convention is defined.

### Regression / Quality

- [ ] `GET /api/health` returns `200`.
- [ ] Unknown endpoint returns `404`.
- [ ] Error responses use a consistent structure.
- [ ] Client responses do not leak sensitive internals.
- [ ] Backend development server starts.
- [ ] TypeScript/build succeeds.
- [ ] Lint succeeds if configured.

---

## Phase 03 Completion Result

Phase 03 passes when the server has a reusable foundation and backend errors consistently produce responses like:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

At that point, the project is ready to proceed to the authentication backend phase.

