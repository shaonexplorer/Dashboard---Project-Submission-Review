# Technology Stack

## Overview

The project uses a TypeScript-based full-stack architecture with a separate frontend and backend.

Core stack:

```text
Frontend:
Next.js + TypeScript + TailwindCSS + ShadCN

Backend:
Node.js + Express.js + TypeScript

Database:
PostgreSQL + Prisma ORM

Authentication:
JWT + bcrypt + RBAC
```

---

# 1. Programming Language

## TypeScript

TypeScript should be used across both frontend and backend.

### Why

- Static type checking
- Improved IDE support
- Safer refactoring
- Shared mental model across the stack
- Better API contracts
- Reduced runtime errors

Avoid unnecessary usage of:

```ts
any;
```

Prefer:

```ts
unknown;
```

when the type is genuinely unknown and validate it before use.

---

# 2. Frontend Framework

## Next.js

Use:

```text
Next.js
App Router
TypeScript
```

### Responsibilities

Next.js handles:

- Page routing
- Layouts
- Authentication pages
- Student dashboard
- Mentor dashboard
- Client UI composition

The Express backend remains responsible for the main application API and business logic.

---

# 3. Styling

## TailwindCSS

Use TailwindCSS for:

- Layout
- Responsive design
- Spacing
- Typography
- Utility styling

### Why

- Fast UI development
- Consistent styling
- Easy responsive behavior
- Works well with ShadCN

Avoid excessive arbitrary styling values when standard Tailwind utilities are sufficient.

---

# 4. UI Components

## ShadCN UI

Use ShadCN for reusable interface components.

Recommended components:

```text
Button
Input
Textarea
Label
Form
Card
Table
Badge
Select
Dialog
Alert Dialog
Dropdown Menu
Skeleton
Pagination
Sonner
```

### Why

- Accessible primitives
- Full source control
- Tailwind-compatible
- Easy customization
- Suitable for dashboard applications

---

# 5. Form Management

## React Hook Form

Use React Hook Form for:

- Login
- Signup
- Submission form
- Rejection feedback form

### Why

- Efficient form state
- Minimal unnecessary re-renders
- Straightforward validation integration
- Good TypeScript support

---

# 6. Validation

## Zod

Use Zod on both frontend and backend.

Frontend:

```text
Form validation
Input validation
User feedback
```

Backend:

```text
Request body validation
Query validation
Route parameter validation
```

The backend validation remains authoritative.

Example:

```ts
const signupSchema = z.object({
  fullName: z.string().min(2).max(100),

  email: z.string().email(),

  password: z.string().min(8),
});
```

---

# 7. Server State

## TanStack Query

Use TanStack Query for managing API data.

Recommended uses:

```text
Current user
Student submission
Mentor submissions
Dashboard statistics
Mutations
Cache invalidation
```

Example query keys:

```ts
["currentUser"]

["mySubmission"]

[
  "submissions",
  {
    page,
    limit,
    status,
    search,
    sortBy,
    sortOrder,
  },
]

["submissionStats"]
```

### Why

TanStack Query provides:

- Request caching
- Loading state
- Error state
- Refetching
- Mutation management
- Cache invalidation

Avoid storing server response data manually in Redux unless there is a specific reason.

---

# 8. Data Table

## TanStack Table

Use TanStack Table for the mentor submission table.

Responsibilities:

- Column definitions
- Header rendering
- Row rendering
- UI table state

Configure server-driven operations:

```ts
manualPagination: true;
manualFiltering: true;
manualSorting: true;
```

The server handles:

```text
Pagination
Filtering
Search
Sorting
```

TanStack Table should not be used to load and filter the complete database in the browser.

---

# 9. Backend Runtime

## Node.js

Node.js runs the Express backend.

Responsibilities:

- API server
- Authentication
- Validation
- Business logic
- Database operations
- Rate limiting

Use an actively supported Node.js LTS release.

---

# 10. Backend Framework

## Express.js

Express handles:

```text
REST API routes
Middleware
Authentication
Authorization
Validation
Error handling
```

Recommended architecture:

```text
routes
controllers
services
middleware
schemas
config
utils
```

---

# 11. Database

## PostgreSQL

PostgreSQL is the primary database.

### Why

The application's data is relational.

Examples:

```text
User → Submission

Mentor → Reviewed Submissions
```

PostgreSQL provides:

- Strong relational integrity
- Constraints
- Transactions
- Indexes
- Reliable filtering
- Aggregation
- Sorting

It is well suited for the mentor dashboard's server-side queries.

---

# 12. ORM

## Prisma ORM

Use Prisma for:

- Schema definition
- Migrations
- Type-safe queries
- Relations
- Database constraints
- Seeding

Example:

```ts
const submissions = await prisma.submission.findMany({
  where,
  skip,
  take: limit,
  orderBy,
  include: {
    student: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
  },
});
```

---

# 13. Password Security

## bcrypt

Use bcrypt to hash user passwords.

Never store plain-text passwords.

Recommended:

```ts
bcrypt.hash(password, 10);
```

or a similar reasonable cost.

Login:

```ts
bcrypt.compare(password, user.passwordHash);
```

---

# 14. Authentication

## JSON Web Token

Use:

```text
jsonwebtoken
```

JWT should contain only necessary identity/authorization claims.

Example:

```ts
{
  userId: string;
  role: "STUDENT" | "MENTOR";
}
```

Avoid putting sensitive profile information inside the token.

---

# 15. Authorization

## Role-Based Access Control

Supported roles:

```text
STUDENT
MENTOR
```

Backend middleware:

```ts
authenticate;
authorize;
```

Example:

```ts
router.get("/submissions", authenticate, authorize("MENTOR"), getSubmissions);
```

RBAC must always be enforced by the backend.

---

# 16. Rate Limiting

## express-rate-limit

Use for:

- General API protection
- Authentication endpoints
- Submission endpoint

Recommended categories:

```text
Global API limiter
Auth limiter
Submission limiter
```

Exact values may be adjusted based on deployment requirements.

---

# 17. HTTP Security

## Helmet

Use:

```text
helmet
```

to configure common HTTP security headers.

Example:

```ts
app.use(helmet());
```

---

# 18. CORS

## cors

Configure Express to accept requests only from expected frontend origins.

Development:

```text
http://localhost:3000
```

Production:

```text
Production frontend domain
```

Avoid:

```ts
origin: "*";
```

for production authenticated APIs unless there is a specific reason.

---

# 19. Environment Management

## dotenv

Use environment variables for:

```text
PORT
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
```

Frontend environment:

```text
NEXT_PUBLIC_API_URL
```

Never commit actual secrets.

Include:

```text
.env.example
```

in the repository.

---

# 20. API Communication

The frontend communicates with the Express API through REST.

Either of the following is acceptable:

```text
Native fetch
Axios
```

Recommended for this scope:

```text
Native fetch
```

because the project does not require advanced Axios-specific functionality.

A small reusable API wrapper should handle:

- Base URL
- Authorization header
- JSON parsing
- Error normalization

Example concept:

```ts
apiFetch("/submissions", {
  method: "POST",
  body: JSON.stringify(data),
});
```

---

# 21. Date Handling

For the current scope, native JavaScript date functionality is sufficient.

Use:

```text
Intl.DateTimeFormat
```

for UI formatting.

Example:

```ts
new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
}).format(new Date(createdAt));
```

Avoid adding a date library unless more advanced date handling becomes necessary.

---

# 22. Recommended Backend Packages

Core:

```text
express
cors
helmet
dotenv
zod
bcrypt
jsonwebtoken
express-rate-limit
@prisma/client
```

Development:

```text
typescript
tsx
prisma
@types/node
@types/express
@types/cors
@types/bcrypt
@types/jsonwebtoken
```

---

# 23. Recommended Frontend Packages

Core:

```text
next
react
react-dom
tailwindcss
zod
react-hook-form
@hookform/resolvers
@tanstack/react-query
@tanstack/react-table
```

Plus the required ShadCN dependencies.

Optional:

```text
lucide-react
```

for icons.

---

# 24. Recommended Backend Folder Structure

```text
server/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── prisma.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── submission.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── submission.service.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── submission.routes.ts
│   │
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   └── submission.schema.ts
│   │
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── validate.ts
│   │   ├── rate-limit.ts
│   │   ├── not-found.ts
│   │   └── error-handler.ts
│   │
│   ├── utils/
│   │   ├── api-error.ts
│   │   ├── jwt.ts
│   │   └── password.ts
│   │
│   ├── types/
│   │   └── express.d.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

# 25. Recommended Frontend Folder Structure

```text
client/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   │
│   │   ├── student/
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   │
│   │   ├── mentor/
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── auth/
│   │   ├── student/
│   │   ├── mentor/
│   │   └── shared/
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── submission.service.ts
│   │
│   ├── hooks/
│   ├── schemas/
│   ├── types/
│   ├── providers/
│   └── lib/
│
├── .env.local
├── .env.example
├── package.json
└── tsconfig.json
```

---

# 26. API Design Style

Use REST conventions.

Authentication:

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

Student:

```text
POST /api/submissions
GET  /api/submissions/me
```

Mentor:

```text
GET   /api/submissions
GET   /api/submissions/stats
GET   /api/submissions/:id
PATCH /api/submissions/:id/status
```

---

# 27. Query Strategy

Mentor list request:

```text
GET /api/submissions
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

```text
/api/submissions?page=1&limit=10&status=PENDING&search=portfolio&sortBy=createdAt&sortOrder=desc
```

Prisma should construct the query dynamically from validated parameters.

---

# 28. Database Index Strategy

Indexes should support common dashboard queries.

Recommended:

```prisma
@@index([status])
@@index([createdAt])
```

Potential future composite index:

```prisma
@@index([status, createdAt])
```

Only add additional indexes if query patterns justify them.

---

# 29. State Management Strategy

Do not introduce Redux unless requirements expand significantly.

Use:

```text
TanStack Query → Server state

React state → Local UI state

React Hook Form → Form state
```

This separation keeps the frontend simple.

---

# 30. Error Handling Strategy

Backend should throw normalized application errors.

Example:

```ts
throw new ApiError(409, "You have already submitted a project");
```

Global middleware handles response formatting.

Frontend converts API errors into:

- Form errors
- Toast messages
- Error states

---

# 31. Deployment Stack

Recommended:

## Frontend

```text
Vercel
```

## Backend

```text
Render
Railway
or Fly.io
```

## PostgreSQL

```text
Neon
Supabase
or Railway
```

Selection should be based on available free-tier limits and deployment simplicity.

---

# 32. Development Tools

Recommended:

```text
Git
GitHub
VS Code
Postman or Bruno
Prisma Studio
```

Prisma Studio may be used during development:

```bash
npx prisma studio
```

---

# 33. Code Quality

Recommended scripts:

Backend:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed"
  }
}
```

Frontend should include:

```text
dev
build
start
lint
```

---

# 34. Testing Stack

Testing is recommended but does not need to become overly complex.

Backend options:

```text
Vitest
Supertest
```

Potential tests:

```text
Authentication
RBAC
Submission duplicate prevention
Pagination
Filtering
Review status update
```

Frontend end-to-end testing is optional for the assignment.

---

# 35. Technologies Intentionally Not Used

For the initial scope, avoid unnecessary dependencies such as:

```text
Redux
GraphQL
WebSockets
Redis
Docker orchestration
Microservices
Kafka
RabbitMQ
Elasticsearch
```

None of these are necessary to satisfy the project requirements.

---

# 36. Final Technology Summary

| Layer              | Technology            |
| ------------------ | --------------------- |
| Language           | TypeScript            |
| Frontend Framework | Next.js               |
| Routing            | Next.js App Router    |
| UI                 | ShadCN                |
| Styling            | TailwindCSS           |
| Forms              | React Hook Form       |
| Validation         | Zod                   |
| Server State       | TanStack Query        |
| Data Table         | TanStack Table        |
| Backend Runtime    | Node.js               |
| Backend Framework  | Express.js            |
| Database           | PostgreSQL            |
| ORM                | Prisma                |
| Authentication     | JWT                   |
| Password Hashing   | bcrypt                |
| Authorization      | RBAC                  |
| Rate Limiting      | express-rate-limit    |
| HTTP Security      | Helmet                |
| API Style          | REST                  |
| Frontend Hosting   | Vercel                |
| Backend Hosting    | Render/Railway/Fly.io |
| Database Hosting   | Neon/Supabase/Railway |

---

# 37. Guiding Technical Rule

When choosing between adding another technology and solving the problem with the existing stack, prefer the existing stack unless the new dependency provides a clear architectural benefit.

The project should demonstrate good engineering decisions rather than the number of technologies used.
