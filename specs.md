# Project Submission & Review Dashboard

## 1. Project Overview

Build a simple full-stack project submission and review dashboard where students can submit their project information and mentors can review, approve, or reject submissions.

Students will register and authenticate before submitting their project. Each student may submit only one project.

Mentors will have access to a protected dashboard where they can:

- View project submissions
- Paginate through submissions
- Filter submissions by status
- Approve submissions
- Reject submissions
- View aggregated submission statistics

The application must implement JWT-based authentication and Role-Based Access Control.

---

# 2. Technical Stack

## Programming Language

- TypeScript

## Frontend

- Next.js
- App Router
- TailwindCSS
- ShadCN UI

Recommended supporting libraries:

- TanStack Query
- TanStack Table
- React Hook Form
- Zod

## Backend

- Node.js
- Express.js
- TypeScript

Recommended supporting libraries:

- Zod
- bcrypt
- jsonwebtoken
- express-rate-limit
- cors
- helmet

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- JWT Authentication
- Role-Based Access Control

Roles:

```text
STUDENT
MENTOR
```

The mentor account can initially be inserted directly into the database using a Prisma seed script.

---

# 3. High-Level Architecture

```text
┌─────────────────────────┐
│       Next.js App       │
│                         │
│ Student Dashboard       │
│ Mentor Dashboard        │
│ Login / Signup          │
└───────────┬─────────────┘
            │
            │ HTTP / REST API
            ▼
┌─────────────────────────┐
│      Express Server     │
│                         │
│ Authentication          │
│ Authorization           │
│ Validation              │
│ Rate Limiting           │
│ Business Logic          │
└───────────┬─────────────┘
            │
            │ Prisma ORM
            ▼
┌─────────────────────────┐
│       PostgreSQL        │
│                         │
│ Users                   │
│ Project Submissions     │
└─────────────────────────┘
```

---

# 4. User Roles

## 4.1 Student

A student can:

- Create an account
- Login
- View their own dashboard
- Submit project information
- View their submitted project
- View review status
- View rejection/mentor feedback if provided

A student cannot:

- Access mentor routes
- Review other students' projects
- Approve/reject projects
- Submit multiple projects

---

## 4.2 Mentor

A mentor can:

- Login
- Access mentor dashboard
- View all submissions
- Paginate submissions
- Filter submissions
- Search submissions
- View aggregated statistics
- Approve projects
- Reject projects
- Optionally leave review feedback

A mentor cannot:

- Register from the public signup page

Mentor accounts should initially be created through database seeding.

---

# 5. Authentication

Authentication should use JWT.

Recommended authentication flow:

```text
Login
  ↓
Validate credentials
  ↓
Generate JWT
  ↓
Return JWT
  ↓
Frontend stores token securely
  ↓
Token included with protected API requests
```

Recommended HTTP request header:

```http
Authorization: Bearer <access_token>
```

JWT payload:

```ts
interface JwtPayload {
  userId: string;
  role: "STUDENT" | "MENTOR";
}
```

Recommended JWT expiration:

```text
7 days
```

Passwords must never be stored directly.

Use:

```text
bcrypt
```

to hash passwords.

Recommended bcrypt rounds:

```text
10-12
```

---

# 6. Authentication Pages

## 6.1 Signup Page

Route:

```text
/signup
```

Only students can register.

Fields:

```text
Full Name
Email
Password
Confirm Password
```

Validation:

### Full Name

- Required
- Minimum 2 characters
- Maximum 100 characters

### Email

- Required
- Must be a valid email address
- Must be unique
- Convert to lowercase before saving

### Password

Required.

Recommended rules:

```text
Minimum 8 characters
At least one uppercase letter
At least one lowercase letter
At least one number
```

### Confirm Password

Must match password.

Successful signup should either:

1. Redirect the user to `/login`

or

2. Automatically authenticate the student

For simplicity, redirecting to login is recommended.

---

# 7. Login Page

Route:

```text
/login
```

Fields:

```text
Email
Password
```

After successful login:

### Student

Redirect to:

```text
/student/dashboard
```

### Mentor

Redirect to:

```text
/mentor/dashboard
```

Invalid credentials should return:

```text
Invalid email or password
```

Do not reveal whether the email exists.

---

# 8. Project Submission

## 8.1 Submission Page

Route:

```text
/student/dashboard
```

If the student has not submitted a project, display the submission form.

If the student has already submitted a project, display their submission instead of allowing another submission.

---

# 9. Submission Fields

The submission form should contain:

```text
Project Name
GitHub Repository URL
Live Link
Description
```

---

# 10. Project Name Validation

Rules:

```text
Required
Minimum: 3 characters
Maximum: 150 characters
```

Example:

```text
Project Submission Dashboard
```

---

# 11. Repository URL Validation

Required.

Should be a valid GitHub repository URL.

Accepted example:

```text
https://github.com/username/project-name
```

Reject malformed URLs.

Recommended validation:

```ts
/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/;
```

The GitHub repository may remain private before the submission deadline.

After the submission deadline, the student is responsible for making the repository public.

The system does not need to automatically validate whether the repository is public unless implemented as an optional enhancement.

---

# 12. Live Link Validation

Required unless the assignment explicitly allows projects without deployment.

Recommended requirement:

```text
Required
Must be a valid HTTP/HTTPS URL
```

Examples:

```text
https://project.vercel.app

https://project.netlify.app
```

---

# 13. Description Validation

Rules:

```text
Required
Minimum: 20 characters
Maximum: 2000 characters
```

The description should briefly explain:

- What the application does
- Key features
- Relevant implementation details

---

# 14. Duplicate Submission Prevention

Each student can submit exactly one project.

Duplicate prevention must be implemented at both:

```text
Application level
Database level
```

Before submission, the API should check whether a submission already exists for the student.

Example:

```ts
const existingSubmission = await prisma.submission.findUnique({
  where: {
    studentId: req.user.userId,
  },
});

if (existingSubmission) {
  throw new Error("You have already submitted a project");
}
```

The database must additionally enforce this using a unique constraint.

Example:

```prisma
studentId String @unique
```

This protects against race conditions where multiple requests are made simultaneously.

---

# 15. Submission Status

Each project should have one of the following statuses:

```text
PENDING
APPROVED
REJECTED
```

Default status:

```text
PENDING
```

When a project is initially submitted:

```text
status = PENDING
```

---

# 16. Submission Editing

For the core assignment, submissions should be immutable after creation.

Therefore students cannot edit their submitted project.

This keeps duplicate submission and review logic simple.

Optional enhancement:

Students may edit their project only while the project status is:

```text
PENDING
```

If editing is implemented, the submission's `updatedAt` value must be updated.

---

# 17. Rate Limiting

The backend must implement basic rate limiting to prevent abuse and spam.

Recommended global rate limit:

```text
100 requests / 15 minutes / IP
```

Authentication endpoints should have stricter limits.

Example:

```text
5 login/signup attempts / minute / IP
```

Submission endpoint:

```text
5 requests / 10 minutes / IP
```

Even though duplicate submission protection prevents multiple projects, rate limiting prevents repeated spam requests.

Recommended library:

```text
express-rate-limit
```

Example:

```ts
const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
});
```

---

# 18. Mentor Review Dashboard

Route:

```text
/mentor/dashboard
```

Only users with role:

```text
MENTOR
```

can access this page.

The dashboard should contain:

```text
Statistics Cards
Filters
Search
Projects Data Table
Pagination
```

---

# 19. Dashboard Statistics

Display aggregated statistics.

Required cards:

```text
Total Submissions
Total Pending
Total Approved
Total Rejected
```

Example:

```text
┌─────────────────┐
│ Total           │
│ 120             │
└─────────────────┘

┌─────────────────┐
│ Pending         │
│ 42              │
└─────────────────┘

┌─────────────────┐
│ Approved        │
│ 63              │
└─────────────────┘

┌─────────────────┐
│ Rejected        │
│ 15              │
└─────────────────┘
```

Statistics should be aggregated by the server/database.

Do not calculate statistics from only the current frontend page.

Example Prisma approach:

```ts
const [total, pending, approved, rejected] = await Promise.all([
  prisma.submission.count(),

  prisma.submission.count({
    where: {
      status: "PENDING",
    },
  }),

  prisma.submission.count({
    where: {
      status: "APPROVED",
    },
  }),

  prisma.submission.count({
    where: {
      status: "REJECTED",
    },
  }),
]);
```

---

# 20. Projects Data Table

Recommended columns:

```text
Student
Project Name
Repository
Live Link
Status
Submitted At
Actions
```

Optional:

```text
Description
Reviewed At
Reviewer
```

Because descriptions may be long, show either:

- Truncated text
- Modal/drawer
- Details page

Recommended approach:

Use a "View Details" action.

---

# 21. Server-Side Pagination

Pagination must be performed by the backend.

Example API request:

```http
GET /api/submissions?page=1&limit=10
```

Default:

```text
page = 1
limit = 10
```

Maximum recommended page size:

```text
50
```

Backend:

```ts
const skip = (page - 1) * limit;
```

Prisma query:

```ts
const submissions = await prisma.submission.findMany({
  skip,
  take: limit,
});
```

The response should contain pagination metadata.

Example:

```json
{
  "success": true,
  "data": [{}],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "totalPages": 12
  }
}
```

---

# 22. Server-Side Filtering

Filtering must happen in the backend.

Supported statuses:

```text
ALL
PENDING
APPROVED
REJECTED
```

Example:

```http
GET /api/submissions?status=APPROVED
```

Combined with pagination:

```http
GET /api/submissions?page=1&limit=10&status=APPROVED
```

Prisma:

```ts
const where = status
  ? {
      status,
    }
  : {};
```

The frontend must not download every submission and perform filtering locally.

---

# 23. Search

Although not explicitly required, server-side search is recommended.

Allow searching by:

```text
Student name
Student email
Project name
```

Example:

```http
GET /api/submissions?search=dashboard
```

Prisma example:

```ts
where: {
  OR: [
    {
      projectName: {
        contains: search,
        mode: "insensitive",
      },
    },
    {
      student: {
        fullName: {
          contains: search,
          mode: "insensitive",
        },
      },
    },
    {
      student: {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
    },
  ],
}
```

---

# 24. Sorting

Recommended server-side sorting options:

```text
Newest submission
Oldest submission
Project name
```

Example:

```http
GET /api/submissions?sortBy=createdAt&sortOrder=desc
```

Allowed fields should be whitelisted.

Do not directly pass arbitrary user input to Prisma's `orderBy`.

Default:

```text
createdAt DESC
```

---

# 25. Approve Submission

Mentor endpoint:

```http
PATCH /api/submissions/:submissionId/status
```

Request:

```json
{
  "status": "APPROVED"
}
```

The backend should verify:

```text
Authenticated user
Role = MENTOR
Submission exists
Status value is allowed
```

After approval:

```text
status = APPROVED
reviewedAt = current timestamp
reviewedById = mentor user ID
```

---

# 26. Reject Submission

Endpoint:

```http
PATCH /api/submissions/:submissionId/status
```

Example:

```json
{
  "status": "REJECTED",
  "feedback": "Repository does not contain the required backend implementation."
}
```

Feedback can be optional but is recommended.

Maximum feedback length:

```text
1000 characters
```

After rejection:

```text
status = REJECTED
reviewedAt = current timestamp
reviewedById = mentor ID
```

---

# 27. Review Confirmation

Before approving or rejecting a project, the frontend should display a confirmation dialog.

Example:

```text
Are you sure you want to approve this submission?

Cancel
Approve
```

For rejection:

```text
Reject Project

Feedback:
[ textarea ]

Cancel
Reject
```

This prevents accidental status changes.

---

# 28. Status Changes

Recommended rule:

Mentors can change a project's review status even if it was previously reviewed.

For example:

```text
PENDING → APPROVED
PENDING → REJECTED
APPROVED → REJECTED
REJECTED → APPROVED
```

This allows mentors to correct accidental actions.

Every change should update:

```text
reviewedAt
reviewedById
```

Optional advanced enhancement:

Keep a `ReviewHistory` table.

This is not required for the initial implementation.

---

# 29. Database Schema

Recommended Prisma schema:

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

model User {
  id           String   @id @default(uuid())
  fullName     String
  email        String   @unique
  passwordHash String
  role         UserRole @default(STUDENT)

  submission Submission? @relation("StudentSubmission")

  reviewedSubmissions Submission[] @relation("SubmissionReviewer")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Submission {
  id          String           @id @default(uuid())

  projectName String
  repoUrl     String
  liveUrl     String
  description String

  status SubmissionStatus @default(PENDING)

  feedback String?

  studentId String @unique

  student User @relation(
    "StudentSubmission",
    fields: [studentId],
    references: [id],
    onDelete: Cascade
  )

  reviewedById String?

  reviewedBy User? @relation(
    "SubmissionReviewer",
    fields: [reviewedById],
    references: [id],
    onDelete: SetNull
  )

  reviewedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

---

# 30. Database Relationship

```text
User
│
├── Student
│      │
│      └── 1 Submission
│
└── Mentor
       │
       └── Reviews many Submissions
```

A student can have:

```text
0 or 1 submission
```

A mentor can review:

```text
Many submissions
```

A submission belongs to exactly:

```text
1 student
```

---

# 31. API Structure

Recommended base URL:

```text
/api
```

---

# 32. Authentication APIs

## Student Signup

```http
POST /api/auth/signup
```

Body:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

---

## Login

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<JWT>",
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT"
    }
  }
}
```

---

## Current User

```http
GET /api/auth/me
```

Protected route.

Example response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

---

# 33. Student APIs

## Create Submission

```http
POST /api/submissions
```

Role:

```text
STUDENT
```

Body:

```json
{
  "projectName": "Submission Dashboard",
  "repoUrl": "https://github.com/john/submission-dashboard",
  "liveUrl": "https://submission-dashboard.vercel.app",
  "description": "A full-stack project submission and review dashboard."
}
```

---

## Get My Submission

```http
GET /api/submissions/me
```

Role:

```text
STUDENT
```

---

# 34. Mentor APIs

## Get Submissions

```http
GET /api/submissions
```

Role:

```text
MENTOR
```

Query parameters:

```text
page
limit
status
search
sortBy
sortOrder
```

Example:

```http
GET /api/submissions?page=2&limit=10&status=PENDING&search=dashboard&sortBy=createdAt&sortOrder=desc
```

---

## Get Submission

```http
GET /api/submissions/:id
```

Role:

```text
MENTOR
```

---

## Update Status

```http
PATCH /api/submissions/:id/status
```

Role:

```text
MENTOR
```

Body:

```json
{
  "status": "APPROVED",
  "feedback": "Excellent implementation."
}
```

---

## Get Statistics

```http
GET /api/submissions/stats
```

Role:

```text
MENTOR
```

Response:

```json
{
  "success": true,
  "data": {
    "total": 120,
    "pending": 42,
    "approved": 63,
    "rejected": 15
  }
}
```

---

# 35. Recommended Express Architecture

```text
src/
│
├── config/
│   ├── env.ts
│   └── prisma.ts
│
├── controllers/
│   ├── auth.controller.ts
│   └── submission.controller.ts
│
├── services/
│   ├── auth.service.ts
│   └── submission.service.ts
│
├── routes/
│   ├── auth.routes.ts
│   └── submission.routes.ts
│
├── middleware/
│   ├── authenticate.ts
│   ├── authorize.ts
│   ├── error-handler.ts
│   ├── rate-limit.ts
│   └── validate.ts
│
├── schemas/
│   ├── auth.schema.ts
│   └── submission.schema.ts
│
├── utils/
│   ├── jwt.ts
│   ├── password.ts
│   └── api-error.ts
│
├── types/
│   └── express.d.ts
│
├── app.ts
└── server.ts
```

Recommended request flow:

```text
Route
 ↓
Authentication Middleware
 ↓
Authorization Middleware
 ↓
Validation Middleware
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

---

# 36. Frontend Architecture

Recommended Next.js structure:

```text
src/
│
├── app/
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   │
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── student/
│   │   └── dashboard/
│   │       └── page.tsx
│   │
│   ├── mentor/
│   │   └── dashboard/
│   │       └── page.tsx
│   │
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── auth/
│   ├── submission/
│   ├── mentor/
│   └── shared/
│
├── hooks/
│
├── lib/
│   ├── api.ts
│   └── auth.ts
│
├── services/
│   ├── auth.service.ts
│   └── submission.service.ts
│
├── schemas/
│
├── types/
│
└── providers/
    └── query-provider.tsx
```

---

# 37. Student Dashboard UI

Recommended layout:

```text
┌─────────────────────────────────────┐
│ Project Submission Portal           │
│                                     │
│ Welcome, John                       │
├─────────────────────────────────────┤
│                                     │
│ Project Name                        │
│ [_______________________________]   │
│                                     │
│ GitHub Repository                   │
│ [_______________________________]   │
│                                     │
│ Live Project                        │
│ [_______________________________]   │
│                                     │
│ Description                         │
│ [                               ]   │
│ [                               ]   │
│                                     │
│                 [Submit Project]    │
│                                     │
└─────────────────────────────────────┘
```

After submission:

```text
┌─────────────────────────────────────┐
│ Your Submission                     │
│                                     │
│ Project: Submission Dashboard       │
│ Status: Pending                     │
│                                     │
│ Repository     View Repository      │
│ Live Project   View Project         │
│                                     │
│ Description...                      │
└─────────────────────────────────────┘
```

---

# 38. Mentor Dashboard UI

Recommended layout:

```text
┌──────────────────────────────────────────────────────┐
│ Mentor Dashboard                                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Total       Pending      Approved      Rejected       │
│ 120         42           63            15             │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Search [____________]   Status [All ▼]               │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Student │ Project │ Status │ Submitted │ Actions     │
│ ---------------------------------------------------  │
│ John    │ App A   │Pending │ Oct 10    │ View Review │
│ Alice   │ App B   │Approve │ Oct 10    │ View Review │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Previous       Page 1 of 12          Next            │
└──────────────────────────────────────────────────────┘
```

---

# 39. ShadCN Components

Recommended components:

```text
Button
Input
Textarea
Form
Card
Table
Badge
Dialog
Dropdown Menu
Select
Alert Dialog
Skeleton
Toast / Sonner
Pagination
```

---

# 40. Status UI

Recommended badges:

```text
PENDING
APPROVED
REJECTED
```

Use visually distinguishable badge variants.

Example:

```text
Pending → Yellow / secondary style
Approved → Green / success style
Rejected → Red / destructive style
```

Do not depend exclusively on color.

Always display the status text.

---

# 41. TanStack Query

Recommended for API state management.

Suggested query keys:

```ts
["currentUser"]["mySubmission"][
  ("submissions",
  {
    page,
    limit,
    status,
    search,
    sortBy,
    sortOrder,
  })
]["submissionStats"];
```

After approving/rejecting a submission:

```ts
queryClient.invalidateQueries({
  queryKey: ["submissions"],
});

queryClient.invalidateQueries({
  queryKey: ["submissionStats"],
});
```

---

# 42. TanStack Table

Recommended for rendering the mentor submissions table.

TanStack Table should handle UI state such as:

```text
Columns
Row rendering
Pagination controls
```

However:

```text
Pagination
Filtering
Searching
Sorting
```

must be executed by the backend.

Therefore configure TanStack Table for manual server-side operations.

Example:

```ts
manualPagination: true,
manualFiltering: true,
manualSorting: true
```

---

# 43. Backend Validation

Every request must be validated on the server.

Do not rely exclusively on frontend validation.

Recommended:

```text
Zod
```

Example submission schema:

```ts
const submissionSchema = z.object({
  projectName: z.string().min(3).max(150),

  repoUrl: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith("https://github.com/"),
      "Repository must be a GitHub URL",
    ),

  liveUrl: z.string().url(),

  description: z.string().min(20).max(2000),
});
```

---

# 44. Authorization Middleware

Example:

```ts
authorize("MENTOR");
```

Usage:

```ts
router.get("/submissions", authenticate, authorize("MENTOR"), getSubmissions);
```

Student example:

```ts
router.post(
  "/submissions",
  authenticate,
  authorize("STUDENT"),
  submissionLimiter,
  createSubmission,
);
```

Never depend exclusively on frontend route protection.

Backend RBAC must always be enforced.

---

# 45. Error Handling

Implement centralized error handling.

Recommended response format:

```json
{
  "success": false,
  "message": "You have already submitted a project"
}
```

Validation errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "repoUrl",
      "message": "Invalid GitHub repository URL"
    }
  ]
}
```

---

# 46. HTTP Status Codes

Recommended conventions:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

Duplicate project submission:

```text
409 Conflict
```

---

# 47. Security Requirements

Implement:

```text
Password hashing
JWT authentication
Role-Based Access Control
Server-side validation
Rate limiting
Helmet
CORS
Environment variables
Database unique constraints
```

Sensitive data must not be exposed through API responses.

Never return:

```text
passwordHash
JWT secret
Database credentials
```

---

# 48. Environment Variables

Backend `.env`:

```env
NODE_ENV=development

PORT=5000

DATABASE_URL=postgresql://username:password@localhost:5432/project_submission

JWT_SECRET=your-secret-key

JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000
```

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

`.env` files must be excluded from Git.

---

# 49. Prisma Seed

Create the mentor account using Prisma seed.

Example mentor:

```text
Name:
System Mentor

Email:
mentor@example.com

Role:
MENTOR
```

Password must be hashed before insertion.

Example command:

```bash
npx prisma db seed
```

Credentials used for demonstration can be documented in the README.

Do not hard-code production credentials in the application source.

---

# 50. API Response Convention

Success:

```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {}
}
```

Paginated response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Failure:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

---

# 51. Loading States

Frontend should display loading states for:

```text
Login
Signup
Creating submission
Fetching student submission
Fetching mentor submissions
Approving submission
Rejecting submission
Fetching statistics
```

Recommended components:

```text
Skeleton
Spinner
Disabled buttons
```

Prevent duplicate form submission by disabling buttons while requests are pending.

---

# 52. Empty States

Mentor dashboard examples:

```text
No project submissions found.
```

Filtered:

```text
No approved projects found.
```

Student:

```text
You have not submitted your project yet.
```

---

# 53. Error States

Examples:

```text
Unable to load submissions.

Unable to submit project.

Unable to update project status.
```

Provide a retry action where appropriate.

---

# 54. Responsive Design

Pages should support:

```text
Desktop
Tablet
Mobile
```

For the mentor table on smaller screens, use one of:

```text
Horizontal scrolling
Responsive cards
Hidden low-priority columns
```

Desktop experience should prioritize the data table.

---

# 55. Accessibility

Forms should include:

```text
Labels
Accessible input descriptions
Keyboard navigation
Visible focus states
Validation messages
```

Buttons should communicate their purpose clearly.

Do not rely entirely on icons.

---

# 56. Authentication Route Protection

Frontend protected routes:

```text
/student/*
/mentor/*
```

Recommended behavior:

Unauthenticated user:

```text
Redirect → /login
```

Student attempting mentor page:

```text
Redirect → /student/dashboard
```

Mentor attempting student page:

```text
Redirect → /mentor/dashboard
```

Frontend protection improves UX.

Backend authorization remains the authoritative security layer.

---

# 57. Suggested Development Phases

## Phase 1 — Project Setup

Create:

```text
Next.js frontend
Express backend
PostgreSQL database
Prisma setup
TailwindCSS
ShadCN
```

---

## Phase 2 — Database

Implement:

```text
User model
Submission model
Enums
Relationships
Indexes
Migration
Seed mentor
```

---

## Phase 3 — Authentication

Implement:

```text
Student signup
Login
Password hashing
JWT
Authentication middleware
Role authorization middleware
GET /auth/me
```

---

## Phase 4 — Student Submission

Implement:

```text
Submission form
Validation
Create submission API
Duplicate protection
Rate limiting
Student submission display
```

---

## Phase 5 — Mentor Dashboard

Implement:

```text
Statistics
Submission list
Server pagination
Server filtering
Server search
Sorting
```

---

## Phase 6 — Review System

Implement:

```text
Approve project
Reject project
Feedback
Confirmation dialog
Cache invalidation
Statistics update
```

---

## Phase 7 — UX Improvements

Implement:

```text
Loading states
Error states
Empty states
Toast notifications
Responsive design
```

---

## Phase 8 — Security and Cleanup

Verify:

```text
RBAC
Validation
Rate limiting
Password security
JWT handling
Database constraints
Environment variables
```

---

# 58. Core Acceptance Criteria

The application is considered complete when all of the following work.

## Authentication

- Student can register.
- Student can login.
- Mentor can login.
- Passwords are securely hashed.
- Protected APIs require JWT.
- Backend enforces RBAC.

## Student

- Student can submit project details.
- Invalid submissions are rejected.
- GitHub URL is validated.
- Live URL is validated.
- Student cannot submit more than one project.
- Database also enforces one submission per student.
- Submission endpoint is rate-limited.
- Student can see their submission and status.

## Mentor

- Mentor can view project submissions.
- Table is paginated.
- Pagination occurs server-side.
- Mentor can filter by status.
- Filtering occurs server-side.
- Mentor can approve a project.
- Mentor can reject a project.
- Mentor can optionally provide review feedback.
- Statistics show total submissions.
- Statistics show pending submissions.
- Statistics show approved submissions.
- Statistics show rejected submissions.
- Statistics are calculated on the server/database.

## Security

- Student cannot access mentor APIs.
- Mentor-only operations require mentor role.
- Password hashes are never returned.
- JWT secret is stored in environment variables.
- API requests are validated.
- API has basic rate limiting.

---

# 59. Optional Enhancements

The following features are optional and should only be implemented after the core requirements are complete.

### Submission Deadline

Store:

```text
SUBMISSION_DEADLINE
```

in environment variables or database settings.

Disable submissions after the deadline.

---

### Repository Availability Check

After the deadline, automatically verify whether the GitHub repository is publicly accessible.

Possible implementation:

```text
GitHub API
```

This is optional because private repositories before the deadline are explicitly allowed.

---

### Review History

Create:

```prisma
model ReviewHistory
```

to record:

```text
Previous status
New status
Reviewer
Feedback
Timestamp
```

---

### Dashboard Analytics

Additional statistics:

```text
Approval rate
Rejection rate
Submissions today
Submissions this week
```

---

### Submission Details Page

Route:

```text
/mentor/submissions/[id]
```

Show:

```text
Student information
Project information
Repository
Live application
Description
Review status
Feedback
```

---

### Refresh Tokens

Implement:

```text
Short-lived access token
Long-lived refresh token
```

Not necessary for the assignment unless stronger authentication is desired.

---

# 60. Out of Scope

Unless specifically requested, do not implement:

```text
GitHub OAuth
Google OAuth
Email verification
Forgot-password flow
File uploads
Multiple mentors with advanced permissions
Student project collaboration
Automatic project grading
Real-time notifications
Complex audit logs
Repository source-code analysis
```

Keep the implementation focused on the assignment requirements.

---

# 61. Recommended Minimum Pages

```text
/login

/signup

/student/dashboard

/mentor/dashboard
```

Optional:

```text
/mentor/submissions/[id]
```

---

# 62. Recommended Minimum API Endpoints

```text
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

POST   /api/submissions
GET    /api/submissions/me

GET    /api/submissions
GET    /api/submissions/stats
GET    /api/submissions/:id
PATCH  /api/submissions/:id/status
```

---

# 63. Final Expected Workflow

## Student

```text
Signup
   ↓
Login
   ↓
Student Dashboard
   ↓
Fill Submission Form
   ↓
Frontend Validation
   ↓
POST /api/submissions
   ↓
Authentication
   ↓
STUDENT Authorization
   ↓
Rate Limit
   ↓
Server Validation
   ↓
Duplicate Check
   ↓
Prisma Insert
   ↓
Submission = PENDING
   ↓
Display Submission
```

---

## Mentor

```text
Login
   ↓
Mentor Dashboard
   ↓
GET /api/submissions/stats
   ↓
Display Statistics

GET /api/submissions
   ↓
Server Pagination
   ↓
Server Filtering
   ↓
Server Search
   ↓
Display Data Table
   ↓
Select Submission
   ↓
Approve / Reject
   ↓
PATCH /api/submissions/:id/status
   ↓
Update Database
   ↓
Refetch Table
   ↓
Refetch Statistics
```

---

# 64. Key Implementation Decisions

The intentional ambiguities in the original requirements are resolved as follows:

1. **One student can submit one project only.**

2. **Project status defaults to `PENDING`.**

3. **Students cannot edit submissions in the core implementation.**

4. **Mentors are seeded directly into the database.**

5. **Only students may register publicly.**

6. **Filtering and pagination are performed server-side.**

7. **Search and sorting should also be server-side if implemented.**

8. **Review feedback is optional but recommended for rejected projects.**

9. **Mentors may change a previously reviewed status to correct mistakes.**

10. **GitHub repositories can remain private before the deadline. Repository visibility does not need to be automatically verified for the core implementation.**

11. **The assignment's "admin" account is treated as the `MENTOR` role because the required review dashboard is mentor-facing.**

12. **JWT authentication and authorization must always be enforced by Express, regardless of frontend route protection.**

---

# 65. Deliverables

The finished project should include:

```text
Frontend application
Backend REST API
PostgreSQL database
Prisma schema and migrations
Prisma seed script
README.md
.env.example
Public GitHub repository after submission deadline
Live deployed application if possible
```

The `README.md` should contain:

```text
Project overview
Technology stack
Architecture
Installation instructions
Environment variables
Database migration instructions
Seed instructions
How to run frontend
How to run backend
Mentor test credentials
API overview
Live application URL
```

The GitHub repository must be made public after the submission deadline so that reviewers can access the source code.
