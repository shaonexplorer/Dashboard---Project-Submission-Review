# Project Submission & Review Dashboard

A simple, secure, and maintainable full-stack platform where students submit their project work and mentors review, filter, approve, or reject submissions. Built as a focused demonstration of solid full-stack engineering practices — not a full LMS.

## Core workflow

1. Student signs up and logs in.
2. Student submits exactly one project (project name, repo URL, live URL, description).
3. Mentor logs in, views all submissions with server-side pagination, filtering, search, and sorting.
4. Mentor approves or rejects submissions with optional feedback.
5. Student views their submission status and mentor feedback.

## Technology stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Frontend | Next.js (App Router), TailwindCSS, ShadCN UI |
| Forms | React Hook Form + Zod |
| Server state | TanStack Query |
| Data table | TanStack Table |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Prisma ORM |
| Authentication | JWT (HS256) + bcrypt (via BetterAuth) |
| Authorization | Role-Based Access Control (STUDENT / MENTOR) |
| Rate limiting | express-rate-limit |
| HTTP security | Helmet + CORS |

## Repository structure

```text
project-submission-dashboard/
│
├── client/              # Next.js frontend (App Router)
│   ├── src/
│   │   ├── app/         # Pages: (auth)/login, (auth)/signup, student/dashboard, student/my-projects, student/submission/[id], mentor/dashboard
│   │   ├── components/  # ui, auth, student, mentor, shared, layout
│   │   ├── lib/         # Utility helpers (api client, auth client, material-symbols, utils)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── providers/   # QueryClientProvider + AuthProvider (combined in Providers)
│   │   ├── schemas/     # Zod validation schemas
│   │   ├── types/       # TypeScript types
│   │   └── lib/         # API client (apiRequest), validations
│   ├── .env.local       # Frontend environment variables (not committed)
│   ├── .env.example     # Frontend environment variable template
│   └── package.json
│
├── server/              # Express.js backend (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── config/      # env.ts, prisma.ts
│   │   ├── modules/     # Feature modules (auth, project, submission)
│   │   │   ├── auth/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── lib/auth.ts (BetterAuth config)
│   │   │   ├── project/
│   │   │   │   ├── project.controller.ts
│   │   │   │   ├── project.routes.ts
│   │   │   │   ├── project.service.ts
│   │   │   │   └── project.validations.ts
│   │   │   └── submission/
│   │   │       ├── submission.controller.ts
│   │   │       ├── submission.routes.ts
│   │   │       ├── submission.service.ts
│   │   │       ├── submission.validations.ts
│   │   │       ├── submissionRateLimiter.middleware.ts
│   │   │       └── authRateLimiter.middleware.ts
│   │   ├── middleware/  # Global middleware (rateLimiter, error, not-found, validate)
│   │   ├── utils/       # api-error, api-response, async-handler, jwt
│   │   ├── types/       # express.d.ts, generated Prisma types
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env             # Backend environment variables (not committed)
│   ├── .env.example     # Backend environment variable template
│   ├── package.json
│   └── tsconfig.json
│
├── specs.md             # Product specification
├── specs/
│   ├── mission.md       # Project mission and principles
│   ├── roadmap.md       # Implementation roadmap
│   └── techstack.md     # Technology stack decisions
├── .gitignore
└── README.md
```

Backend responsibility chain (module-based):

```text
Route → Authentication → Authorization → Validation → Controller → Service → Prisma ORM → PostgreSQL
```

## Authentication flow

The frontend uses a **unified fetcher** (`client/src/lib/api/unified-fetcher.ts`) with BetterAuth's **bearer token** flow. The session token is stored in a cookie on the Next.js client domain and forwarded to the Express backend via the `Authorization: Bearer <token>` header.

```
Browser (Client Components)     Browser (Server Components)
         │                              │
         ▼                              ▼
auth_client.signIn()             Server Component
         │                              │
         ▼                              ▼
set-auth-token header           cookies().get("auth_token")
         │                              │
         ▼                              ▼
Cookie.set("auth_token")  →  Authorization: Bearer <token>
         │                              │
         ▼                              ▼
unifiedFetch reads cookie       fetch() with Authorization header
         │                              │
         └──────────────┬───────────────┘
                        ▼
               Express backend
               bearer plugin validates
               Authorization header
```

**Key points:**
- BetterAuth with `bearer` plugin handles session management on the backend
- On sign-in/sign-up, the server returns the session token in the `set-auth-token` response header
- Client captures this header and stores the token in an `auth_token` cookie on the **Next.js domain** (SameSite: lax, httpOnly: false for client-side access)
- **Client Components**: `unifiedFetch` reads the `auth_token` cookie and sends `Authorization: Bearer <token>` header
- **Server Components**: `fetchFromApi` extracts `auth_token` from incoming request cookies and forwards it as `Authorization: Bearer <token>` header
- **Route Protection**: Next.js middleware (`client/src/middleware.ts`) checks for `auth_token` cookie presence
- **Logout**: Clears the `auth_token` cookie via `signOutWithCookieClear()`
- No `credentials: "include"` needed — token is explicitly forwarded in Authorization header

This architecture works identically on localhost and in production (with proper `secure: true` in production).

## Middleware

The Express middleware chain (`server/src/middleware/`) handles:
- **Global rate limiting** — 100 requests per 2 minutes
- **Auth rate limiting** — 5 requests per minute on auth endpoints
- **Submission rate limiting** — 5 requests per 10 minutes on submission endpoints
- **Validation** — Zod schema validation via `validate` middleware
- **Authentication** — JWT verification via `authenticate` middleware
- **Authorization** — Role checking via `authorize("MENTOR")` / `authorize("STUDENT")`
- **Error handling** — Centralized error responses via `errorHandler`
- **Not found** — 404 handler for unmatched routes

Copy the example files and fill in real values before running the app:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Backend (`server/.env`):

| Variable | Description | Example |
| --- | --- | --- |
| PORT | Express server port | `5000` |
| DATABASE_URL | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| BETTER_AUTH_SECRET | Secret for BetterAuth sessions (min 32 chars) | long random string |
| BETTER_AUTH_URL | Backend auth base URL | `http://localhost:5000` |
| CLIENT_URL | Allowed frontend origin (CORS) | `http://localhost:3000` |

Frontend (`client/.env.local`):

| Variable | Description | Example |
| --- | --- | --- |
| NEXT_PUBLIC_BETTER_AUTH_URL | Backend auth base URL | `http://localhost:5000` |

Never commit actual `.env` files.

## Database

The schema lives in `server/prisma/schema.prisma`:

- `User` — id, fullName, email (unique), passwordHash, role (STUDENT / MENTOR), createdAt, updatedAt
- `Submission` — id, projectName, repoUrl, liveUrl, description, status (PENDING / APPROVED / REJECTED), studentId (unique), student relation, feedback, reviewedAt, reviewedById, createdAt, updatedAt
- `Project` — id, name, slug (unique), description, repoUrl, liveUrl, thumbnailUrl, technologies[], order, isActive, createdAt, updatedAt

Indexes: `Submission.status`, `Submission.createdAt`, `Project.slug`.

## Setup

### Backend

```bash
cd server
npm install
cp .env.example .env   # edit with your values
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed     # creates the mentor account
npm run dev            # tsx watch src/server.ts
```

### Frontend

```bash
cd client
npm install
cp .env.example .env.local   # edit with your values
npm run dev
```

## Seed mentor account

There is no public mentor registration. A mentor account is created through the Prisma seed script at `server/prisma/seed.ts`:

```text
Email:    mentor@example.com
Full name: System Mentor
Role:     MENTOR
```

Run from the `server` directory:

```bash
npx prisma db seed
```

The seed is idempotent: it creates the mentor account on the first run and updates it (name, role, password hash) on subsequent runs, so it can safely be re-run after resets.

The password is hashed with bcrypt and taken from the `SEED_MENTOR_PASSWORD` environment variable (see `server/.env.example`). Change it before any non-local deployment.

## API endpoints

All endpoints are **Express backend routes** (mounted at `/api/*`). The frontend calls these directly via the `apiRequest` utility.

Auth (`/api/auth`):

- `POST /api/auth/signup` — student registration (rate-limited)
- `POST /api/auth/login` — student or mentor login (rate-limited)
- `GET /api/auth/me` — current user (requires auth cookie)
- `POST /api/auth/logout` — clears httpOnly cookie

Student (`/api/submissions`, requires STUDENT role):

- `POST /api/submissions` — create a submission (rate-limited)
- `GET /api/submissions/me` — own submission
- `PATCH /api/submissions/me` — update own submission (resubmit)

Mentor (`/api/submissions`, requires MENTOR role):

- `GET /api/submissions` — paginated, filterable, searchable, sortable list
- `GET /api/submissions/stats` — submission statistics
- `GET /api/submissions/:id` — single submission
- `PATCH /api/submissions/:id/status` — approve or reject with optional feedback

Project catalog (`/api/projects`, public):

- `GET /api/projects` — list all active projects (paginated)
- `GET /api/projects/:slug` — single project by slug

> **Note:** The Express backend runs at `http://<backend>/api/*`. The frontend `apiRequest` utility constructs the full URL using `NEXT_PUBLIC_API_URL`.

## Specification documents

- `specs/mission.md` — project mission, principles, user journeys, definition of success
- `specs/techstack.md` — technology stack and package recommendations
- `specs/roadmap.md` — phased implementation plan (Phases 0–22)
- `specs.md` — high-level product overview and architecture

## Roles

| Role | Can |
| --- | --- |
| STUDENT | Sign up, log in, submit one project, view own submission status and feedback, resubmit if rejected |
| MENTOR | Log in, view all submissions, paginate/filter/search/sort, approve or reject with feedback, view statistics |

## Security

- Passwords are hashed with bcrypt (never stored or returned in plain text)
- Session tokens managed by BetterAuth with HMAC-signed cookies
- Protected API routes with backend-enforced RBAC
- BetterAuth bearer plugin validates `Authorization: Bearer <token>` header on backend
- Token stored in `auth_token` cookie on Next.js domain (SameSite: lax, httpOnly: false for client-side access)
- Rate limiting on auth and submission endpoints
- Helmet security headers and strict CORS (no `origin: "*"`, exposes `set-auth-token` header)
- Server-side validation with Zod; database-level uniqueness constraints on `User.email` and `Submission.studentId`
- BetterAuth handles secure session management with the `bearer` plugin

## Frontend Architecture Highlights

- **TanStack Query** for server state management (5 min stale time, 1 retry, no refetch on window focus)
- **Unified fetcher** (`unifiedFetch`) for both Client and Server Components with typed error handling (`ApiRequestError` with status, fieldErrors, code)
- **BetterAuth React client** with bearer token flow (stores `auth_token` cookie, sends Authorization header)
- **Combined Providers** component wraps `QueryClientProvider` and initializes auth client
- **Next.js middleware** (`client/src/middleware.ts`) for route protection via `auth_token` cookie check
- **Material Symbols** subset font for icons (check `client/src/lib/material-symbols.ts` for available ligatures)
- **Design system** in `client/src/app/globals.css` with CSS variables for colors, typography, spacing, shadows
- **Route groups**: `(auth)` for login/signup, `student/` and `mentor/` for protected routes