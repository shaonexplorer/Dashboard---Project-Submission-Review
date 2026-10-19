# Development Roadmap

## Overview

This roadmap breaks the project into implementation phases so that each stage produces a stable foundation for the next one.

Development should follow this general order:

```text
Foundation
   ↓
Database
   ↓
Backend Core
   ↓
Authentication
   ↓
Student Submission
   ↓
Mentor Dashboard
   ↓
Review Workflow
   ↓
Security / UX
   ↓
Testing
   ↓
Deployment
```

Do not begin with the dashboard UI before the database and API contracts are clearly defined.

---

# Phase 0 — Repository and Planning

## Goals

Prepare the repository and define the application's architecture.

## Tasks

- [x] Create Git repository
- [x] Add `README.md`
- [x] Add `specs.md`
- [x] Add `mission.md`
- [x] Add `roadmap.md`
- [x] Add `techstack.md`
- [x] Add `.gitignore`
- [x] Decide frontend/backend folder structure (`client/` + `server/`)
- [x] Document environment variables (`server/.env.example`, `client/.env.example`)

Recommended repository structure:

```text
project-submission-dashboard/
│
├── client/
│
├── server/
│
├── specs.md
├── mission.md
├── roadmap.md
├── techstack.md
└── README.md
```

Alternative monorepo tooling is not required.

## Completion Criteria

- Repository exists
- Architecture is documented
- Frontend and backend responsibilities are clear

---

# Phase 1 — Frontend and Backend Setup

## Backend

Initialize:

```text
Node.js
Express
TypeScript
```

Install core packages.

Create:

```text
src/
├── app.ts
└── server.ts
```

Configure:

- TypeScript
- Development script
- Production build script
- Environment variables
- CORS
- Helmet
- JSON body parsing

Create basic health endpoint:

```http
GET /api/health
```

Expected:

```json
{
  "success": true,
  "message": "Server is running"
}
```

---

## Frontend

Create Next.js application using:

```text
Next.js
TypeScript
TailwindCSS
App Router
```

Install:

- ShadCN
- TanStack Query
- TanStack Table
- React Hook Form
- Zod

Create base layouts.

## Completion Criteria

```text
Frontend runs
Backend runs
Frontend can communicate with backend
Environment variables work
```

---

# Phase 2 — PostgreSQL and Prisma

## Goals

Create the persistent data model.

## Tasks

Install and configure Prisma.

Create:

```text
prisma/schema.prisma
```

Implement enums:

```prisma
enum UserRole {
  STUDENT
  MENTOR
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}
```

Implement:

```text
User
Submission
```

Important constraints:

```text
User.email UNIQUE
Submission.studentId UNIQUE
```

Create database indexes for:

```text
Submission.status
Submission.createdAt
```

Run migration.

Generate Prisma Client.

## Completion Criteria

- Database connection works
- Migration succeeds
- Prisma Client works
- Database schema matches `specs.md`

---

# Phase 3 — Backend Foundation

## Goals

Establish reusable backend architecture before implementing features.

## Folder Structure

```text
server/src/
│
├── config/
│
├── controllers/
│
├── services/
│
├── routes/
│
├── middleware/
│
├── schemas/
│
├── utils/
│
├── types/
├── app.ts
└── server.ts
```

## Tasks

Create:

- Prisma singleton/client
- Environment configuration
- Async error handling strategy
- Custom API error class
- Global error middleware
- 404 middleware
- Validation middleware
- Standard API response convention

## Completion Criteria

Backend errors return consistent responses.

Example:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

---

# Phase 4 — Authentication Backend

## Goals

Implement secure JWT authentication.

## Tasks

### Signup

Implement:

```http
POST /api/auth/signup
```

Validation:

- Full name
- Email
- Password

Process:

```text
Validate
 ↓
Normalize email
 ↓
Check duplicate email
 ↓
Hash password
 ↓
Create STUDENT user
 ↓
Return safe user data
```

---

### Login

Implement:

```http
POST /api/auth/login
```

Process:

```text
Find user
 ↓
Compare password
 ↓
Generate JWT
 ↓
Return token + user
```

---

### Authentication Middleware

Implement:

```text
authenticate
```

Responsibilities:

- Read Bearer token
- Verify JWT
- Extract user ID
- Extract role
- Attach authenticated user information to request

---

### Authorization Middleware

Implement:

```text
authorize(...roles)
```

Examples:

```ts
authorize("STUDENT");
```

```ts
authorize("MENTOR");
```

---

### Current User

Implement:

```http
GET /api/auth/me
```

## Completion Criteria

- Student can register
- Student can login
- Seeded mentor can login
- Protected endpoint rejects missing token
- Invalid token returns 401
- Wrong role returns 403

---

# Phase 5 — Mentor Seed

## Goals

Provide a mentor account without public mentor registration.

## Tasks

Create Prisma seed file.

Seed:

```text
System Mentor
mentor@example.com
MENTOR
```

Hash password using bcrypt.

Add seed instructions to README.

## Completion Criteria

Running:

```bash
npx prisma db seed
```

creates or updates the mentor account.

---

# Phase 6 — Authentication Frontend

## Goals

Implement login and signup experience.

## Routes

```text
/login
/signup
```

## Tasks

Create:

- Login form
- Signup form
- Zod schemas
- React Hook Form integration
- Authentication API service
- Token management
- Current user query
- Logout functionality

## Redirect Logic

Student:

```text
/student/dashboard
```

Mentor:

```text
/mentor/dashboard
```

## Completion Criteria

- Student can register through UI
- Student can login
- Mentor can login
- Invalid credentials show error
- Loading state is visible
- Successful login redirects correctly

---

# Phase 7 — Protected Routing

## Goals

Prevent users from accessing inappropriate frontend routes.

## Protected Routes

```text
/student/*
/mentor/*
```

## Rules

Unauthenticated:

```text
→ /login
```

Student on mentor route:

```text
→ /student/dashboard
```

Mentor on student route:

```text
→ /mentor/dashboard
```

Backend authorization must remain active regardless of frontend protection.

## Completion Criteria

Frontend navigation respects authentication and roles.

---

# Phase 8 — Student Submission Backend

## Goals

Implement project submission API.

## Endpoint

```http
POST /api/submissions
```

Role:

```text
STUDENT
```

## Validation

Validate:

```text
projectName
repoUrl
liveUrl
description
```

## Duplicate Protection

Check existing student submission.

Return:

```text
409 Conflict
```

when duplicate exists.

Also rely on:

```prisma
studentId String @unique
```

## Rate Limiting

Add a submission-specific limiter.

Example target:

```text
5 requests / 10 minutes / IP
```

## Completion Criteria

- Valid submission succeeds
- Invalid URL fails
- Missing data fails
- Mentor cannot submit
- Duplicate submission returns 409
- Rate limiter works

---

# Phase 9 — Student Submission Frontend

## Goals

Create the student dashboard.

## Route

```text
/student/dashboard
```

## Tasks

Implement submission form containing:

```text
Project Name
Repository URL
Live Link
Description
```

Use:

- React Hook Form
- Zod
- ShadCN Form
- TanStack Query mutation

After submission:

- Hide form
- Show submitted project
- Show status badge

## Completion Criteria

Student can complete the entire submission workflow through the UI.

---

# Phase 10 — Get Student Submission

## Backend

Implement:

```http
GET /api/submissions/me
```

Role:

```text
STUDENT
```

Return:

- Submission details
- Status
- Feedback
- Review timestamp

## Frontend

Create:

```ts
["mySubmission"];
```

TanStack Query.

Show:

- Project name
- Repo link
- Live link
- Description
- Status
- Feedback

## Completion Criteria

Refresh does not lose submission state.

Submission information always comes from backend.

---

# Phase 11 — Mentor Submission List Backend

## Goals

Build the mentor data API.

## Endpoint

```http
GET /api/submissions
```

Role:

```text
MENTOR
```

Support:

```text
page
limit
status
search
sortBy
sortOrder
```

## Pagination

Use:

```text
skip
take
```

Return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Filtering

Support:

```text
PENDING
APPROVED
REJECTED
```

## Search

Search:

- Project name
- Student name
- Student email

## Sorting

Whitelist:

```text
createdAt
projectName
status
```

## Completion Criteria

All table operations work directly through query parameters.

---

# Phase 12 — Mentor Statistics Backend

## Endpoint

```http
GET /api/submissions/stats
```

Return:

```text
total
pending
approved
rejected
```

Use database aggregation/count queries.

Do not calculate using paginated results.

## Completion Criteria

Statistics accurately represent the full database.

---

# Phase 13 — Mentor Dashboard UI

## Goals

Build the primary review interface.

## Route

```text
/mentor/dashboard
```

## Sections

```text
Statistics Cards
Search
Status Filter
Submission Table
Pagination
```

## Statistics Cards

Show:

```text
Total
Pending
Approved
Rejected
```

## Data Table

Columns:

```text
Student
Project
Repository
Live Link
Status
Submitted At
Actions
```

Use TanStack Table.

Enable:

```ts
manualPagination: true;
manualFiltering: true;
manualSorting: true;
```

## Completion Criteria

Changing:

```text
Page
Status
Search
Sort
```

results in a new server request.

---

# Phase 14 — Review Actions Backend

## Endpoint

```http
PATCH /api/submissions/:id/status
```

Role:

```text
MENTOR
```

Input:

```json
{
  "status": "APPROVED",
  "feedback": "Optional review feedback"
}
```

Validate allowed statuses.

Update:

```text
status
feedback
reviewedAt
reviewedById
```

## Completion Criteria

Mentor can update project state securely.

---

# Phase 15 — Review Actions Frontend

## Goals

Add approve/reject workflows.

## Approve

Use confirmation dialog.

Example:

```text
Are you sure you want to approve this project?
```

## Reject

Use dialog with optional feedback textarea.

After mutation, invalidate:

```ts
["submissions"]["submissionStats"];
```

## Completion Criteria

Table and statistics update immediately after successful review.

---

# Phase 16 — Loading, Error, and Empty States

## Loading

Implement for:

- Login
- Signup
- Submission creation
- Student submission
- Mentor table
- Statistics
- Review mutations

## Error

Provide readable messages.

## Empty States

Examples:

```text
No submissions found.
```

```text
No rejected submissions found.
```

## Completion Criteria

No major page should show a blank screen during network activity.

---

# Phase 17 — Rate Limiting and Security Hardening

## Implement

- Global rate limiter
- Auth rate limiter
- Submission limiter
- Helmet
- Strict CORS
- Input trimming
- Environment validation
- JWT expiration
- Safe error responses

## Review

Verify:

```text
passwordHash is never returned
JWT_SECRET is not committed
DATABASE_URL is not committed
```

## Completion Criteria

Security checklist in `specs.md` is satisfied.

---

# Phase 18 — Responsive Design and Accessibility

## Responsive

Verify:

```text
Mobile
Tablet
Desktop
```

The mentor table may use horizontal scrolling on small screens.

## Accessibility

Verify:

- Inputs have labels
- Buttons have clear text
- Dialogs are keyboard accessible
- Errors are understandable
- Status indicators include text
- Focus states remain visible

---

# Phase 19 — Testing

## Backend Tests

Priority test cases:

### Authentication

- Signup succeeds
- Duplicate email fails
- Invalid login fails
- Valid login returns token
- Protected route rejects no token
- Student blocked from mentor API

### Submission

- Student can submit
- Duplicate submission fails
- Invalid repository URL fails
- Mentor cannot submit

### Mentor

- Pagination works
- Filter works
- Search works
- Approval works
- Rejection works
- Statistics work

---

## Manual Frontend Testing

Test:

```text
Student signup → login → submit
Mentor login → review
Student login → see updated status
```

Test responsive views.

---

# Phase 20 — Deployment Preparation

## Frontend

Recommended deployment:

```text
Vercel
```

## Backend

Possible deployment platforms:

```text
Render
Railway
Fly.io
```

## PostgreSQL

Possible providers:

```text
Neon
Supabase
Railway PostgreSQL
```

## Tasks

Set production environment variables.

Configure:

```text
CLIENT_URL
NEXT_PUBLIC_API_URL
DATABASE_URL
JWT_SECRET
```

Run production Prisma migration.

Seed mentor.

---

# Phase 21 — Repository Finalization

Before submission:

- Remove unused code
- Remove console logs
- Run TypeScript checks
- Run lint
- Verify `.env` is ignored
- Add `.env.example`
- Update README
- Document mentor credentials
- Add live URLs
- Verify repository structure

---

# Phase 22 — Submission Checklist

Verify:

```text
[ ] Signup works
[ ] Login works
[ ] Student dashboard works
[ ] Submission works
[ ] Duplicate prevention works
[ ] Rate limit works
[ ] Mentor dashboard works
[ ] Pagination is server-side
[ ] Filtering is server-side
[ ] Statistics work
[ ] Approve works
[ ] Reject works
[ ] RBAC works
[ ] Repository is accessible
[ ] README instructions work
[ ] Production application works
```

---

# Suggested Priority Levels

## P0 — Mandatory

```text
Authentication
RBAC
Student signup
Student submission
Duplicate prevention
Rate limiting
Mentor dashboard
Pagination
Filtering
Statistics
Approve
Reject
```

---

## P1 — Recommended

```text
Search
Sorting
Feedback
Responsive design
Loading states
Confirmation dialogs
```

---

## P2 — Optional

```text
Deadline enforcement
GitHub repository visibility check
Review history
Advanced analytics
Refresh tokens
Email notifications
```

P2 features should never delay completion of P0 features.
