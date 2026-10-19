# Phase 03 — Backend Foundation Requirements

## Purpose

Define the mandatory requirements for the reusable backend foundation required before authentication and feature-specific development begins.

---

## 1. Phase Scope Requirements

Phase 03 must establish backend infrastructure only.

It must include:

- reusable backend folder organization
- Prisma client configuration
- centralized environment configuration
- asynchronous error-handling strategy
- custom API error class
- global error middleware
- 404 middleware
- validation middleware
- standard API response convention

It must not require implementation of:

- signup
- login
- JWT authentication
- role authorization
- mentor seed logic
- project submission endpoints
- mentor submission listing
- statistics
- approve/reject workflows

---

## 2. Backend Folder Structure Requirements

The backend must provide clearly separated locations for:

```text
config
controllers
services
routes
middleware
schemas
utils
types
```

The backend must retain:

```text
src/app.ts
src/server.ts
```

Recommended structure:

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

Directory names may vary only when their responsibilities remain unambiguous.

---

## 3. Application/Server Separation Requirements

`app.ts` must be responsible for Express application composition.

It should contain or register:

- Express middleware
- routes
- 404 handling
- global error handling

`server.ts` must be responsible for starting the HTTP server.

Feature business logic must not be placed directly in `server.ts`.

---

## 4. Environment Configuration Requirements

Environment values required by the server must be centralized through a configuration module.

At minimum, the existing backend should support values such as:

```text
PORT
DATABASE_URL
CLIENT_URL
NODE_ENV
```

Requirements:

- `.env` must remain uncommitted.
- Application modules should consume centralized configuration where practical.
- Missing critical configuration should fail predictably rather than causing obscure runtime failures.
- `.env.example` should remain compatible with the environment values expected by the project.

JWT-related environment requirements belong to the authentication phase rather than Phase 03.

---

## 5. Prisma Client Requirements

The backend must expose a reusable Prisma client from a centralized module.

Expected responsibility:

```text
src/config/prisma.ts
```

Requirements:

- Instantiate `PrismaClient` through one shared configuration module.
- Services created in future phases must be able to import this client.
- Route handlers must not create a new Prisma client per request.
- The implementation must use the Prisma client generated from the Phase 02 schema/setup.

---

## 6. API Response Convention Requirements

The backend must establish consistent success and error response shapes.

### Successful Response

Recommended baseline:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

`data` may be omitted when no payload is required.

### Error Response

Required baseline:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

Requirements:

- `success` must clearly indicate the outcome.
- Error responses must include a readable `message`.
- Future controllers should be able to follow the same convention.
- Error implementation details must not be exposed unnecessarily.

---

## 7. Custom API Error Requirements

A reusable custom error class must exist.

Recommended name:

```text
ApiError
```

Minimum required information:

```text
statusCode
message
```

The class must extend JavaScript's native `Error` behavior.

Expected usage pattern:

```ts
throw new ApiError(404, "Resource not found");
```

The global error middleware must be able to interpret this error.

---

## 8. Async Error Handling Requirements

The backend must define a consistent method for forwarding asynchronous errors to Express error middleware.

The implementation should prevent repeated boilerplate such as:

```ts
try {
  // logic
} catch (error) {
  next(error);
}
```

inside every future controller.

A reusable async wrapper/helper is acceptable.

Requirements:

- Rejected promises from async controllers must reach the global error handler.
- The strategy must be reusable in later route/controller phases.
- Errors must not silently disappear or leave requests hanging.

---

## 9. Global Error Middleware Requirements

A global Express error middleware must be registered after application routes.

It must:

- accept errors passed through Express
- derive an HTTP status code
- produce the standard error response
- return a safe fallback for unexpected errors
- avoid sending multiple responses

Expected standard example:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

Unexpected errors should default to an appropriate server error response, normally:

```http
500 Internal Server Error
```

---

## 10. 404 Middleware Requirements

Requests that do not match any registered route must receive a `404` response.

Example request:

```http
GET /api/unknown
```

Expected status:

```http
404 Not Found
```

Expected body convention:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

The 404 handler must execute only after valid application routes have had a chance to match.

---

## 11. Validation Middleware Requirements

The backend must provide reusable validation middleware for future request schemas.

It should support validation of relevant request sources such as:

```text
req.body
req.query
req.params
```

Requirements:

- Validation logic should not need to be rewritten in each controller.
- Validation failures should produce predictable client errors.
- Validation errors should flow through or conform to the standard backend error-response convention.
- Phase 03 does not require implementing signup/submission-specific schemas.

A Zod-based solution is acceptable if Zod is installed/configured for the backend.

---

## 12. Controller Responsibility Requirements

Controllers introduced in later phases must be able to follow this responsibility boundary:

```text
Receive HTTP request
↓
Read validated request data
↓
Call service
↓
Return HTTP response
```

Controllers should not become the primary location for database/business logic.

Phase 03 only needs the directory and architecture needed to support this pattern.

---

## 13. Service Responsibility Requirements

The `services/` layer must be reserved for:

- business logic
- database operations
- reusable domain operations

Future services should import the shared Prisma client rather than instantiate their own clients.

---

## 14. Route Responsibility Requirements

The `routes/` layer must be prepared to define:

- route paths
- HTTP methods
- middleware order
- controllers

Feature routes themselves are outside the required Phase 03 scope except for routes already created in previous phases, such as the health endpoint.

---

## 15. Schema Responsibility Requirements

The `schemas/` directory must be reserved for reusable request-validation schemas.

Future feature schemas should be separated from controllers and services.

---

## 16. Middleware Ordering Requirements

The Express application must maintain a valid middleware order.

Recommended order:

```text
security/CORS/body middleware
↓
routes
↓
404 handler
↓
global error handler
```

The global error middleware must be registered after normal application middleware/routes.

---

## 17. Existing Health Endpoint Requirement

The Phase 01 health endpoint must continue to work after restructuring.

```http
GET /api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running"
}
```

A backend-foundation refactor must not break this endpoint.

---

## 18. TypeScript Requirements

All Phase 03 backend code must remain TypeScript-compatible.

Requirements:

- no unresolved imports
- no avoidable implicit `any` errors under the project's TypeScript configuration
- middleware signatures should be compatible with Express types
- shared utility/type declarations should be typed where appropriate
- production build/type-check must complete successfully

---

## 19. Error Safety Requirements

Client-facing error responses must not unnecessarily expose:

- stack traces
- database credentials
- environment secrets
- internal file paths
- raw sensitive configuration

Development logging may contain useful debugging detail on the server side, but public API responses should remain safe.

---

## 20. Maintainability Requirements

The Phase 03 architecture must reduce duplication in later phases.

A future authentication or submissions feature should be able to reuse:

```text
environment config
Prisma client
validation middleware
async error handling
ApiError
global error handler
API response convention
```

without recreating them.

---

## Acceptance Criteria

Phase 03 requirements are satisfied when all of the following are true:

- [ ] Backend directories for config, controllers, services, routes, middleware, schemas, utils, and types exist.
- [ ] `app.ts` and `server.ts` responsibilities are separated.
- [ ] Environment configuration is centralized.
- [ ] A reusable Prisma client exists.
- [ ] A custom API error mechanism exists.
- [ ] Async errors can reach the global error handler.
- [ ] A global error middleware exists.
- [ ] A 404 middleware exists.
- [ ] Validation middleware exists and is reusable.
- [ ] API error responses follow a consistent format.
- [ ] The existing health endpoint still works.
- [ ] Unknown routes return a standardized `404` response.
- [ ] TypeScript/build checks succeed.
- [ ] Authentication and feature-specific logic have not been pulled into this phase.

