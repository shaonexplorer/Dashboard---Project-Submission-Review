# Phase 1 — Validation Checklist

## Purpose

Use this document to verify that Phase 1 — Frontend and Backend Setup is complete before beginning Phase 2.

Status convention:

```text
[ ] Not validated
[x] Passed
```

## 1. Backend Validation

### VAL-BE-01 — Backend starts in development

**Check**

Run the backend development script.

**Expected**

- Process starts without a TypeScript/runtime error.
- Express server listens on the configured port.

**Status**

```text
[ ] PASS
```

### VAL-BE-02 — Required backend source files exist

**Check**

Verify:

```text
server/src/app.ts
server/src/server.ts
```

**Expected**

Both files exist and are part of the working backend.

**Status**

```text
[ ] PASS
```

### VAL-BE-03 — TypeScript configuration works

**Check**

Run the configured TypeScript/production build.

**Expected**

Compilation succeeds without TypeScript errors.

**Status**

```text
[ ] PASS
```

### VAL-BE-04 — Production build script works

**Check**

Run the backend production build script.

**Expected**

- Command exits successfully.
- Compiled production output is generated according to the project's TypeScript configuration.

**Status**

```text
[ ] PASS
```

### VAL-BE-05 — Environment variables load

**Check**

Configure the backend environment values required for Phase 1, including the server port and frontend origin.

**Expected**

- Server uses the configured port.
- CORS uses the configured client origin.
- Environment-dependent values do not require editing their source-level deployment origins.

**Status**

```text
[ ] PASS
```

### VAL-BE-06 — JSON body parsing configured

**Check**

Inspect the Express application configuration.

**Expected**

JSON body parsing middleware is registered.

**Status**

```text
[ ] PASS
```

### VAL-BE-07 — Helmet configured

**Check**

Inspect the Express middleware configuration and/or a backend response.

**Expected**

Helmet middleware is registered without preventing the application from starting.

**Status**

```text
[ ] PASS
```

### VAL-BE-08 — CORS configured

**Check**

Send a request to the backend from the configured frontend origin.

**Expected**

The allowed frontend origin can access the API without a browser CORS rejection.

**Status**

```text
[ ] PASS
```

## 2. Health Endpoint Validation

### VAL-API-01 — Health route exists

**Request**

```http
GET /api/health
```

**Expected**

The route responds successfully while the backend is running.

**Status**

```text
[ ] PASS
```

### VAL-API-02 — Health response contract

**Request**

```http
GET /api/health
```

**Expected body**

```json
{
  "success": true,
  "message": "Server is running"
}
```

**Validation**

- `success` exists.
- `success` equals `true`.
- `message` exists.
- `message` equals `Server is running`.

**Status**

```text
[ ] PASS
```

## 3. Frontend Validation

### VAL-FE-01 — Frontend starts

**Check**

Run the Next.js development server.

**Expected**

- Next.js starts without a blocking error.
- Application is accessible in the browser.

**Status**

```text
[ ] PASS
```

### VAL-FE-02 — TypeScript enabled

**Check**

Inspect the Next.js project configuration/source files and run its available type/build validation.

**Expected**

The frontend is configured as a TypeScript project.

**Status**

```text
[ ] PASS
```

### VAL-FE-03 — TailwindCSS works

**Check**

Render a simple element using Tailwind utility classes.

**Expected**

Tailwind styles are applied correctly.

**Status**

```text
[ ] PASS
```

### VAL-FE-04 — App Router is used

**Check**

Verify the frontend contains the App Router structure, including the application layout.

Example:

```text
src/app/
```

**Expected**

Pages/layouts are based on the Next.js App Router.

**Status**

```text
[ ] PASS
```

### VAL-FE-05 — ShadCN configured

**Check**

Verify ShadCN initialization/configuration is present.

**Expected**

The project is ready to use ShadCN components in later phases.

**Status**

```text
[ ] PASS
```

### VAL-FE-06 — TanStack Query installed

**Check**

Inspect frontend dependencies.

**Expected**

TanStack Query is installed.

**Status**

```text
[ ] PASS
```

### VAL-FE-07 — TanStack Table installed

**Check**

Inspect frontend dependencies.

**Expected**

TanStack Table is installed.

**Status**

```text
[ ] PASS
```

### VAL-FE-08 — React Hook Form installed

**Check**

Inspect frontend dependencies.

**Expected**

React Hook Form is installed.

**Status**

```text
[ ] PASS
```

### VAL-FE-09 — Zod installed

**Check**

Inspect frontend dependencies.

**Expected**

Zod is installed.

**Status**

```text
[ ] PASS
```

### VAL-FE-10 — Base layout works

**Check**

Load the application through its root layout.

**Expected**

- Layout renders successfully.
- Child page content renders.
- Global styling is available.

**Status**

```text
[ ] PASS
```

## 4. Environment Validation

### VAL-ENV-01 — Backend environment configuration

**Check**

Verify the backend can consume values such as:

```env
PORT=
CLIENT_URL=
```

**Expected**

Changing configured values changes the relevant runtime configuration without rewriting the corresponding source-level origin/port values.

**Status**

```text
[ ] PASS
```

### VAL-ENV-02 — Frontend API environment configuration

**Check**

Verify the frontend can consume:

```env
NEXT_PUBLIC_API_URL=
```

**Expected**

The frontend derives its backend API base URL from environment configuration.

**Status**

```text
[ ] PASS
```

## 5. Frontend-to-Backend Integration Validation

### VAL-INT-01 — Both applications run simultaneously

**Check**

Start the frontend and backend development servers.

**Expected**

Both applications remain operational at the same time.

**Status**

```text
[ ] PASS
```

### VAL-INT-02 — Frontend reaches health endpoint

**Check**

From the frontend application, request:

```text
${NEXT_PUBLIC_API_URL}/api/health
```

**Expected response**

```json
{
  "success": true,
  "message": "Server is running"
}
```

**Expected browser behavior**

- Request succeeds.
- No CORS error occurs for the configured frontend origin.
- Response can be consumed by the frontend.

**Status**

```text
[ ] PASS
```

## 6. Scope Validation

### VAL-SCOPE-01 — Phase remains focused

**Check**

Review the Phase 1 implementation.

**Expected**

Phase 1 does not depend on completing later feature phases such as:

```text
Prisma/database models
Authentication
RBAC
Student submissions
Mentor dashboard APIs
Review actions
```

**Status**

```text
[ ] PASS
```

## 7. Final Phase 1 Gate

Phase 1 must not be marked complete until every required completion criterion from the roadmap passes.

```text
[ ] Frontend runs
[ ] Backend runs
[ ] Frontend can communicate with backend
[ ] Environment variables work
```

Additional setup verification:

```text
[ ] Express + TypeScript backend initialized
[ ] app.ts exists
[ ] server.ts exists
[ ] TypeScript configuration works
[ ] Development script works
[ ] Production build works
[ ] CORS configured
[ ] Helmet configured
[ ] JSON body parsing configured
[ ] GET /api/health works
[ ] Health response matches contract
[ ] Next.js frontend initialized
[ ] TypeScript enabled
[ ] TailwindCSS enabled
[ ] App Router used
[ ] ShadCN configured
[ ] TanStack Query installed
[ ] TanStack Table installed
[ ] React Hook Form installed
[ ] Zod installed
[ ] Base layout created
```

## Phase 1 Result

```text
[ ] PASS — Ready for Phase 2
[ ] FAIL — Resolve failed validations before Phase 2
```
