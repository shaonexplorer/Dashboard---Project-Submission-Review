# Phase 1 — Requirements

## 1. Objective

Phase 1 must establish a working frontend and backend foundation for the project. Both applications must run, environment configuration must work, and the frontend must be able to communicate with the backend.

## 2. Backend Requirements

### REQ-BE-01 — Runtime

The backend must use Node.js.

### REQ-BE-02 — Framework

The backend must use Express.

### REQ-BE-03 — Language

The backend must be implemented with TypeScript.

### REQ-BE-04 — Required entry files

The backend must contain:

```text
src/
├── app.ts
└── server.ts
```

### REQ-BE-05 — Application configuration

`app.ts` must create/configure the Express application.

### REQ-BE-06 — Server startup

`server.ts` must start the backend HTTP server.

### REQ-BE-07 — TypeScript configuration

The backend must include a working TypeScript configuration that supports development and production compilation.

### REQ-BE-08 — Development script

The backend must provide a package script that starts the application for development.

### REQ-BE-09 — Production build script

The backend must provide a package script that compiles the TypeScript application for production.

### REQ-BE-10 — Environment variables

Backend runtime configuration must support environment variables.

At minimum, Phase 1 configuration should support:

```env
PORT=
CLIENT_URL=
```

### REQ-BE-11 — CORS

The backend must configure CORS so the frontend can make requests from the configured client origin.

### REQ-BE-12 — Helmet

The backend must configure Helmet middleware.

### REQ-BE-13 — JSON body parsing

The backend must configure JSON request body parsing.

### REQ-BE-14 — Health endpoint

The backend must expose:

```http
GET /api/health
```

### REQ-BE-15 — Health response

A successful health request must return the roadmap-defined response:

```json
{
  "success": true,
  "message": "Server is running"
}
```

## 3. Frontend Requirements

### REQ-FE-01 — Framework

The frontend must use Next.js.

### REQ-FE-02 — Language

The frontend must use TypeScript.

### REQ-FE-03 — Styling

The frontend must use TailwindCSS.

### REQ-FE-04 — Routing architecture

The frontend must use the Next.js App Router.

### REQ-FE-05 — ShadCN

ShadCN must be installed/configured for future application UI components.

### REQ-FE-06 — TanStack Query

TanStack Query must be installed for later server-state/API operations.

### REQ-FE-07 — TanStack Table

TanStack Table must be installed for later tabular mentor dashboard functionality.

### REQ-FE-08 — React Hook Form

React Hook Form must be installed for later form handling.

### REQ-FE-09 — Zod

Zod must be installed for later validation schemas.

### REQ-FE-10 — Base layout

The frontend must contain a functioning base App Router layout.

The base layout must render application content and load the project's global styling.

### REQ-FE-11 — API environment configuration

The frontend must support an environment variable for the backend API URL.

Expected configuration:

```env
NEXT_PUBLIC_API_URL=
```

Frontend code must use this configured value when connecting to the backend rather than depending on a duplicated hard-coded backend origin.

## 4. Integration Requirements

### REQ-INT-01 — Independent startup

The frontend and backend must each be able to run successfully.

### REQ-INT-02 — Backend reachability

The health endpoint must be reachable while the backend is running.

### REQ-INT-03 — Frontend/backend communication

The frontend must be able to communicate with the backend.

The Phase 1 integration check should use:

```http
GET /api/health
```

### REQ-INT-04 — CORS compatibility

A request from the frontend origin to the backend must not fail because of the configured CORS policy when the environment values are correct.

### REQ-INT-05 — Environment-based integration

Changing the configured API/client URL through environment variables must not require changing application source code that merely identifies the deployment origin.

## 5. Configuration Requirements

The setup must clearly distinguish frontend and backend environment configuration.

Backend:

```env
PORT=
CLIENT_URL=
```

Frontend:

```env
NEXT_PUBLIC_API_URL=
```

Actual environment-specific values are not defined by the Phase 1 roadmap and should be supplied for the relevant development/deployment environment.

## 6. Scope Constraints

The following are not Phase 1 requirements and should not be implemented as part of this phase unless required only as harmless setup for the listed Phase 1 technologies:

- PostgreSQL schema
- Prisma schema/client
- Database migrations
- User models
- Submission models
- JWT authentication
- Signup/login
- RBAC
- Student submission APIs
- Mentor APIs
- Dashboard feature implementation
- Review workflow

These belong to later roadmap phases.

## 7. Acceptance Requirements

Phase 1 is accepted when:

```text
Frontend runs
Backend runs
Frontend can communicate with backend
Environment variables work
```

Additionally, the backend setup and frontend dependencies/configuration explicitly listed for Phase 1 must be present and operational enough to support later phases.
