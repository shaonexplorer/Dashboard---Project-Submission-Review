# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Submission & Review Dashboard** — A full-stack application where students submit project work and mentors review submissions. Built with TypeScript, Next.js (frontend), Express.js (backend), PostgreSQL, and Prisma ORM.

## Repository Structure

```
project-submission-dashboard/
├── client/                 # Next.js frontend (App Router)
│   ├── src/
│   │   ├── app/           # Pages and layouts
│   │   ├── components/    # React components (ui/, auth/, etc.)
│   │   ├── lib/           # Utilities (api, auth, utils)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service functions
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── types/         # TypeScript types
│   │   └── providers/     # React context providers
│   └── package.json
│
├── server/                 # Express.js backend
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Database seeding
│   ├── src/
│   │   ├── config/        # env.ts, prisma.ts
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── routes/        # Route definitions
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── utils/         # JWT, api-error, api-response, async-handler
│   │   ├── types/         # TypeScript types (express.d.ts)
│   │   ├── app.ts         # Express app setup
│   │   └── server.ts      # Server entry point
│   └── package.json
│
├── specs/                  # Detailed specifications
│   ├── mission.md
│   ├── techstack.md
│   ├── roadmap.md
│   └── [phase folders]/
│
├── specs.md               # Full project specification
└── CLAUDE.md              # This file
```

## Common Development Commands

### Backend (run from `server/` directory)

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Prisma commands
npm run prisma:generate   # Generate Prisma Client
npm run prisma:migrate    # Run migrations (dev)
npm run prisma:seed       # Seed database (mentor account)
npm run prisma:studio     # Open Prisma Studio
```

### Frontend (run from `client/` directory)

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

### Environment Setup

**Backend** (`server/.env`):
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

**Frontend** (`client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Copy from `.env.example` files in each directory.

## Architecture Overview

### Backend Request Flow

```
Route → authenticate → authorize → validate → Controller → Service → Prisma → PostgreSQL
```

- **Routes** (`src/routes/`): Endpoint definitions, middleware composition
- **Controllers** (`src/controllers/`): Read request input, call services, create HTTP responses
- **Services** (`src/services/`): Business logic, database operations, business rule validation
- **Middleware** (`src/middleware/`): Authentication, authorization, validation, rate limiting, error handling
- **Config** (`src/config/`): Environment validation, Prisma singleton
- **Utils** (`src/utils/`): JWT, API errors/responses, async handler

### Key Backend Patterns

**Async Handler** — Wraps controllers to catch errors automatically:
```ts
export const signupController = asyncHandler(async (req, res) => { ... });
```

**Standard API Response**:
```ts
// Success
{ success: true, message: "...", data: {...} }

// Error
{ success: false, message: "...", errors?: [...] }

// Paginated
{ success: true, data: [...], pagination: { page, limit, total, totalPages } }
```

**Validation Middleware** (Zod):
```ts
router.post("/signup", validate(signupSchema, "body"), signupController);
```

**Authentication** — Cookie-based JWT:
- Token stored in `token` cookie (httpOnly, secure in production)
- `authenticate` middleware reads cookie, verifies JWT, attaches `req.user`
- `authorize("MENTOR")` middleware checks role

### Database Schema

```prisma
enum UserRole { STUDENT, MENTOR }
enum SubmissionStatus { PENDING, APPROVED, REJECTED }

model User {
  id           String   @id @default(uuid())
  fullName     String
  email        String   @unique
  passwordHash String
  role         UserRole @default(STUDENT)
  submission   Submission? @relation("StudentSubmission")
  reviewedSubmissions Submission[] @relation("SubmissionReviewer")
}

model Submission {
  id          String           @id @default(uuid())
  projectName String
  repoUrl     String
  liveUrl     String
  description String
  status      SubmissionStatus @default(PENDING)
  feedback    String?
  studentId   String  @unique
  reviewedById String?
  student     User    @relation("StudentSubmission", fields: [studentId], references: [id])
  reviewedBy  User?   @relation("SubmissionReviewer", fields: [reviewedById], references: [id])
  reviewedAt  DateTime?
  @@index([status])
  @@index([createdAt])
}
```

### Frontend Architecture

- **Pages** (`src/app/`): Next.js App Router with route groups `(auth)/`, `student/`, `mentor/`
- **Components** (`src/components/`): Reusable UI (shadcn/ui), feature-specific components
- **Services** (`src/services/`): API calls using native fetch with base URL, auth handling
- **Hooks** (`src/hooks/`): TanStack Query hooks for server state
- **Providers** (`src/providers/`): QueryClientProvider, AuthProvider
- **State Management**: TanStack Query (server state), React state (UI), React Hook Form (forms)

### API Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | Public | Student registration |
| POST | `/api/auth/login` | Public | Login (returns JWT in cookie) |
| GET | `/api/auth/me` | Auth | Current user profile |
| POST | `/api/submissions` | STUDENT | Create submission |
| GET | `/api/submissions/me` | STUDENT | Get own submission |
| GET | `/api/submissions` | MENTOR | List submissions (paginated, filtered) |
| GET | `/api/submissions/stats` | MENTOR | Aggregated statistics |
| PATCH | `/api/submissions/:id/status` | MENTOR | Approve/reject with feedback |

Mentor list query params: `page`, `limit`, `status`, `search`, `sortBy`, `sortOrder`

## Current Implementation Status

Based on git history, the following phases are complete:
- ✅ Phase 0: Repository & Planning
- ✅ Phase 1: Frontend & Backend Setup
- ✅ Phase 2: PostgreSQL & Prisma
- ✅ Phase 3: Backend Foundation
- ✅ Phase 4: Authentication Backend
- ✅ Phase 5: Mentor Seed
- ✅ Phase 6: Authentication Frontend (login/signup forms, validation, API integration)

**Next phases to implement:**
- Phase 7: Protected Routing
- Phase 8: Student Submission Backend
- Phase 9: Student Submission Frontend
- Phase 10: Get Student Submission
- Phase 11-13: Mentor Dashboard (Backend + UI)
- Phase 14-15: Review Actions (Backend + Frontend)
- Phase 16-18: UX, Security, Responsive Design

## Key Development Guidelines

### Security Requirements (from specs)
- Password hashing with bcrypt (10-12 rounds)
- JWT with 7-day expiry, stored in httpOnly cookie
- RBAC enforced on backend (never trust frontend)
- Rate limiting: global (100/15min), auth (5/min), submission (5/10min)
- Helmet, strict CORS, env variable validation
- Never expose: `passwordHash`, `JWT_SECRET`, `DATABASE_URL`

### Database Constraints
- `User.email` — UNIQUE
- `Submission.studentId` — UNIQUE (prevents duplicate submissions)
- `SubmissionStatus` restricted to PENDING/APPROVED/REJECTED

### Server-Side Operations (mandatory)
- Pagination, filtering, search, sorting, aggregation — ALL on backend
- Frontend sends query params, receives paginated response
- TanStack Table configured with `manualPagination: true`, `manualFiltering: true`, `manualSorting: true`

### Code Quality
- TypeScript strict mode, avoid `any` (use `unknown`)
- Zod validation on both frontend and backend (backend authoritative)
- Consistent error handling via `ApiError` class and global middleware
- No `console.log` in production code

## Useful Skills Available

This project has Prisma-related skills available in `server/.claude/skills/`:
- `prisma-cli`, `prisma-client-api`, `prisma-orm-setup`, `prisma-upgrade-v7`, etc.

Use the Skill tool when working with Prisma for up-to-date reference.

## Testing Commands

No test framework configured yet. Roadmap recommends:
- Backend: Vitest + Supertest
- Priority tests: Authentication, RBAC, duplicate prevention, pagination, filtering, review status updates

## Deployment Targets (from specs)

- Frontend: Vercel
- Backend: Render / Railway / Fly.io
- Database: Neon / Supabase / Railway PostgreSQL

Production env vars needed: `CLIENT_URL`, `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, `JWT_SECRET`

## Design System

The project uses a custom design system defined in `design.md` and implemented in:

- **CSS Variables** (`client/src/app/globals.css`): Complete design token system including colors, typography, spacing, shadows, and component styles
- **Tailwind Config** (`client/tailwind.config.ts`): Extended theme with design tokens accessible as Tailwind utilities

### Key Design Tokens

**Colors**: Deep slate neutrals with indigo accents (#3525cd primary), semantic status colors (pending=amber, approved=emerald, rejected=rose)

**Typography**: 
- `Inter` for UI text (display, headline, body, label)
- `JetBrains Mono` for code/monospace elements

**Spacing**: 8pt base unit (space-xs=4px, space-sm=8px, space-md=16px, space-lg=24px, space-xl=32px)

**Border Radius**: 8px default (rounded-lg), 6px for micro-controls, 9999px for badges

**Shadows**: 4 levels (0-3) with cool-slate ambient shadows

**Focus Rings**: Dual-ring (white inner + indigo outer) for WCAG 2.1 AA compliance

### Component Classes (in globals.css)

- `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-destructive`
- `.input-base`, `.input-error`
- `.badge-pending`, `.badge-approved`, `.badge-rejected`
- `.card-base`, `.card-interactive`
- `.code-block`, `.git-chip`
- Typography utilities: `.text-display`, `.text-headline-lg`, `.text-body-md`, `.text-label-md`, `.text-code-md`, etc.
- Layout: `.container-main` (max-width 1440px), `.sidebar` (260px fixed)

### Fonts

Loaded via `next/font/google` in `client/src/app/layout.tsx`:
- `Inter` (variable: `--font-sans`)
- `JetBrains Mono` (variable: `--font-mono`)