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
| Authentication | JWT + bcrypt |
| Authorization | Role-Based Access Control (STUDENT / MENTOR) |
| Rate limiting | express-rate-limit |
| HTTP security | Helmet + CORS |

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

## Environment variables

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

Auth:

- `POST /api/auth/signup` — student registration
- `POST /api/auth/login` — student or mentor login
- `GET /api/auth/me` — current user (protected)

Student:

- `POST /api/submissions` — create a submission (STUDENT, rate-limited)
- `GET /api/submissions/me` — own submission (STUDENT)

Mentor:

- `GET /api/submissions` — paginated, filterable, searchable, sortable list (MENTOR)
- `GET /api/submissions/stats` — submission statistics (MENTOR)
- `GET /api/submissions/:id` — single submission (MENTOR)
- `PATCH /api/submissions/:id/status` — approve or reject with optional feedback (MENTOR)

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
- Rate limiting on auth and submission endpoints
- Helmet security headers and strict CORS (no `origin: "*"`)
- Server-side validation with Zod; database-level uniqueness constraints on `User.email` and `Submission.studentId`
