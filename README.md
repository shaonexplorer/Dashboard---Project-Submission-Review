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
| Authentication | JWT (HS256) + bcrypt |
| Authorization | Role-Based Access Control (STUDENT / MENTOR) |
| Rate limiting | express-rate-limit |
| HTTP security | Helmet + CORS |
| JWT verification (frontend) | jose (Edge-compatible) |

## Repository structure

```text
project-submission-dashboard/
│
├── client/              # Next.js frontend (App Router)
│   ├── src/
│   │   ├── app/         # Pages: (auth)/login, (auth)/signup, student/dashboard, mentor/dashboard
│   │   ├── components/  # ui, auth, student, mentor, shared
│   │   ├── services/    # API wrappers (auth.service.ts, submission.service.ts)
│   │   ├── hooks/       # TanStack Query hooks
│   │   ├── schemas/     # Zod validation schemas
│   │   ├── types/       # TypeScript types
│   │   ├── providers/   # Query client + auth providers
│   │   └── lib/         # Utility helpers
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
│   │   ├── controllers/ # auth.controller.ts, submission.controller.ts
│   │   ├── services/    # auth.service.ts, submission.service.ts
│   │   ├── routes/      # auth.routes.ts, submission.routes.ts
│   │   ├── schemas/     # auth.schema.ts, submission.schema.ts
│   │   ├── middleware/  # authenticate, authorize, validate, rate-limit, not-found, error-handler
│   │   ├── utils/       # api-error, jwt, password
│   │   ├── types/       # express.d.ts
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

Backend responsibility chain:

```text
Route → Authentication → Authorization → Validation → Controller → Service → Prisma ORM → PostgreSQL
```

## Authentication flow

The frontend uses **Next.js API routes** (`client/src/app/api/auth/*`) as a proxy layer between the browser and the Express backend. This solves cross-domain cookie issues in production (Vercel frontend ↔ Render/Railway backend).

```
Browser → Next.js API route → Express backend (sets JWT in httpOnly cookie)
                                    ↓
                         Next.js reads cookie, sets it on own domain
                                    ↓
                         Returns { user, token } to browser
```

**Key points:**
- JWT lives in an **httpOnly cookie** on the Next.js domain (set by `/api/auth/login` and `/api/auth/signup`)
- The token is also returned in the JSON response body so the client can store it in `localStorage` as a **session marker** (enables `useCurrentUser` query)
- Middleware verifies the JWT **locally** using the shared `JWT_SECRET` — no cross-domain call to the backend
- `/api/auth/me` proxies to the backend with the cookie for fresh user data
- Logout clears the cookie via `/api/auth/logout`

This architecture works identically on localhost and in production.

## Middleware

The Next.js middleware (`client/src/middleware.ts`) protects `/student/*` and `/mentor/*` routes:

1. Reads the `token` cookie from the request (same domain — always available)
2. Verifies JWT locally using `jose` with `JWT_SECRET` (Node.js runtime)
3. Extracts `userId` and `role` from the payload
4. Redirects to `/auth` if token is missing, invalid, or role doesn't match the route
5. Runs in **Node.js runtime** (`export const runtime = "nodejs"`) for crypto compatibility

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
| JWT_SECRET | Secret for signing JWTs | long random string |
| JWT_EXPIRES_IN | Token expiration | `7d` |
| CLIENT_URL | Allowed frontend origin (CORS) | `http://localhost:3000` |

Frontend (`client/.env.local`):

| Variable | Description | Example |
| --- | --- | --- |
| NEXT_PUBLIC_API_URL | Backend API base URL | `http://localhost:5000/api` |

Never commit actual `.env` files.

## Database

The schema lives in `server/prisma/schema.prisma`:

- `User` — id, fullName, email (unique), passwordHash, role (STUDENT / MENTOR), createdAt, updatedAt
- `Submission` — id, projectName, repoUrl, liveUrl, description, status (PENDING / APPROVED / REJECTED), studentId (unique), student relation, feedback, reviewedAt, reviewedById, createdAt, updatedAt

Indexes: `Submission.status`, `Submission.createdAt`.

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

All endpoints below are **Next.js API routes** (under `client/src/app/api/*`) that proxy to the Express backend. The browser calls these on the frontend domain, avoiding CORS/cookie issues.

Auth (Next.js routes):

- `POST /api/auth/signup` — student registration (proxies to backend, sets httpOnly cookie + returns token)
- `POST /api/auth/login` — student or mentor login (proxies to backend, sets httpOnly cookie + returns token)
- `GET /api/auth/me` — current user (proxies to backend with cookie, returns user)
- `POST /api/auth/logout` — clears httpOnly cookie

Student (proxied to backend with auth cookie):

- `POST /api/submissions` — create a submission (STUDENT, rate-limited)
- `GET /api/submissions/me` — own submission (STUDENT)

Mentor (proxied to backend with auth cookie):

- `GET /api/submissions` — paginated, filterable, searchable, sortable list (MENTOR)
- `GET /api/submissions/stats` — submission statistics (MENTOR)
- `GET /api/submissions/:id` — single submission (MENTOR)
- `PATCH /api/submissions/:id/status` — approve or reject with optional feedback (MENTOR)

> **Note:** The actual Express backend endpoints are at `http://<backend>/api/auth/*` and `http://<backend>/api/submissions/*`. The Next.js routes forward requests with the `token` cookie for authentication.

## Specification documents

- `specs/mission.md` — project mission, principles, user journeys, definition of success
- `specs/techstack.md` — technology stack and package recommendations
- `specs/roadmap.md` — phased implementation plan (Phases 0–22)
- `specs.md` — high-level product overview and architecture

## Roles

| Role | Can |
| --- | --- |
| STUDENT | Sign up, log in, submit one project, view own submission status and feedback |
| MENTOR | Log in, view all submissions, paginate/filter/search/sort, approve or reject with feedback, view statistics |

## Security

- Passwords are hashed with bcrypt (never stored or returned in plain text)
- JWT contains only identity claims (`userId`, `role`)
- Protected API routes with backend-enforced RBAC
- Middleware verifies JWT **locally** using shared `JWT_SECRET` (no backend call, works cross-domain)
- Rate limiting on auth and submission endpoints
- Helmet security headers and strict CORS (no `origin: "*"`)
- Server-side validation with Zod; database-level uniqueness constraints on `User.email` and `Submission.studentId`
