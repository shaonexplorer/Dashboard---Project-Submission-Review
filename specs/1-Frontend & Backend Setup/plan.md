# Phase 1 — Implementation Plan

## Purpose

Set up the frontend and backend foundations so both applications run independently, use environment-based configuration, and can communicate successfully.

## Scope

Phase 1 includes only:

- Express + TypeScript backend initialization
- Core backend middleware and configuration
- Health-check API
- Next.js + TypeScript + TailwindCSS frontend initialization
- Frontend libraries required by the roadmap
- Base frontend layouts
- Frontend-to-backend connectivity

Database, Prisma, authentication, authorization, and project submission features are outside this phase.

## 1. Backend Setup

Work inside the `server/` application.

### 1.1 Initialize the backend

- Initialize the Node.js project.
- Install Express.
- Install TypeScript and the required Node/Express type definitions.
- Create the TypeScript configuration.

### 1.2 Create the initial source structure

```text
server/
├── src/
│   ├── app.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── .env
```

Responsibilities:

- `app.ts` creates and configures the Express application.
- `server.ts` starts the HTTP server and listens on the configured port.

Keep application configuration separate from server startup so the Express application can be reused more easily in later phases.

### 1.3 Configure backend scripts

Add scripts for at least:

```text
development
production build
production start
```

The development script should run the TypeScript backend in development mode.

The production build script should compile TypeScript successfully.

The production start script should run the compiled application.

### 1.4 Configure environment variables

Add environment-based configuration for values required during setup, including the backend port and frontend origin used by CORS.

Expected variables for this phase:

```env
PORT=
CLIENT_URL=
```

Do not hard-code environment-specific URLs or ports when an environment variable should be used.

### 1.5 Configure core Express middleware

Configure:

- CORS
- Helmet
- `express.json()` JSON body parsing

CORS should allow the configured frontend application to communicate with the backend.

### 1.6 Implement the health endpoint

Create:

```http
GET /api/health
```

Expected successful response:

```json
{
  "success": true,
  "message": "Server is running"
}
```

Use this endpoint as the initial verification that the backend is running and reachable.

## 2. Frontend Setup

Work inside the `client/` application.

### 2.1 Initialize Next.js

Create the frontend using:

- Next.js
- TypeScript
- TailwindCSS
- App Router

Expected high-level structure:

```text
client/
├── src/
│   └── app/
├── package.json
└── .env.local
```

The exact generated Next.js support files may vary.

### 2.2 Install required frontend libraries

Install and configure:

- ShadCN
- TanStack Query
- TanStack Table
- React Hook Form
- Zod

Only initial installation/configuration is required in this phase. Feature-specific tables, forms, schemas, and mutations belong to later phases.

### 2.3 Create base layouts

Establish the initial App Router layout foundation.

At minimum:

- Root layout exists.
- Global Tailwind styles are loaded.
- Application content renders through the layout.
- The structure is ready for later student, mentor, and authentication pages.

Do not build the full dashboards during this phase.

### 2.4 Configure frontend environment variables

Configure the frontend with the backend API base URL.

Expected variable:

```env
NEXT_PUBLIC_API_URL=
```

Frontend API requests should derive the backend URL from this configuration instead of hard-coding it throughout the application.

## 3. Frontend-to-Backend Connectivity

After both applications run independently, verify communication between them.

Use the backend health endpoint as the connectivity target:

```http
GET /api/health
```

The frontend must be able to make a request to the configured backend URL and receive the expected health response without a CORS failure.

This verification may be implemented with a minimal temporary or setup-level request. Do not introduce feature APIs that belong to later roadmap phases.

## 4. Recommended Execution Order

1. Initialize `server/`.
2. Configure TypeScript and backend scripts.
3. Create `app.ts` and `server.ts`.
4. Configure environment variables.
5. Configure CORS, Helmet, and JSON parsing.
6. Implement `GET /api/health`.
7. Verify backend development startup and production build.
8. Initialize `client/` with Next.js, TypeScript, TailwindCSS, and App Router.
9. Install/configure ShadCN, TanStack Query, TanStack Table, React Hook Form, and Zod.
10. Create the base frontend layout.
11. Configure `NEXT_PUBLIC_API_URL`.
12. Start frontend and backend together.
13. Verify frontend-to-backend communication through `/api/health`.
14. Run the Phase 1 validation checklist.

## 5. Phase Deliverables

By the end of Phase 1, the repository should contain functioning `client/` and `server/` applications with the required dependencies and configuration.

The backend should expose:

```http
GET /api/health
```

The frontend should be able to reach that endpoint using environment-based API configuration.

## 6. Definition of Done

Phase 1 is complete only when all of the following are true:

- Frontend runs successfully.
- Backend runs successfully.
- Backend TypeScript configuration works.
- Backend development script works.
- Backend production build works.
- Environment variables are loaded correctly.
- CORS is configured.
- Helmet is configured.
- JSON body parsing is configured.
- `GET /api/health` returns the expected response.
- Next.js uses TypeScript, TailwindCSS, and App Router.
- Required frontend packages are installed/configured.
- Base layouts exist.
- Frontend can communicate with backend.

Do not begin Phase 2 until these conditions pass.
