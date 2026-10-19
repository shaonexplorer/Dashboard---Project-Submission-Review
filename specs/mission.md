# Mission

## Project Mission

Build a simple, secure, and maintainable project submission and review platform that enables students to submit their project work and mentors to efficiently review, filter, approve, or reject submissions.

The system should prioritize:

- Simplicity
- Clear role separation
- Reliable validation
- Secure authentication
- Server-side data handling
- Maintainable architecture
- Good developer experience
- Clean and responsive user experience

The goal is not to build a large learning management system.

The goal is to build a focused application that demonstrates solid full-stack engineering practices using:

- TypeScript
- Next.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Role-Based Access Control

---

# 1. Core Problem

Project submissions are often handled manually through:

- Google Forms
- Spreadsheets
- Messages
- Email
- Shared documents

These approaches make it difficult to:

- Prevent duplicate submissions
- Track review status
- Filter reviewed projects
- Manage access based on user roles
- View submission statistics
- Maintain a consistent review workflow

This application should provide a centralized workflow for both students and mentors.

---

# 2. Primary Users

The platform has two primary user roles.

## Student

Students need a simple way to:

- Create an account
- Login securely
- Submit project information
- Ensure their project is submitted successfully
- View their current review status
- View mentor feedback when available

The student experience should be simple and focused.

A student should not need to navigate through unnecessary administrative interfaces.

---

## Mentor

Mentors need an efficient way to:

- Login securely
- View all submissions
- Search submissions
- Filter submissions by status
- Navigate through large submission lists
- Approve projects
- Reject projects
- Provide feedback
- Monitor submission statistics

The mentor dashboard should prioritize data visibility and fast review operations.

---

# 3. Product Principles

## 3.1 Keep the Scope Focused

Implement only functionality that supports the core submission and review workflow.

Avoid unnecessary features such as:

- Social login
- Notifications
- File upload systems
- Complex audit logs
- Messaging systems
- Advanced organization management

These features may be added later if required.

---

## 3.2 Backend Is the Source of Truth

Business rules must be enforced by the backend.

Examples:

- Only students can create submissions
- Only mentors can review submissions
- Each student can submit only once
- Pagination must be performed server-side
- Filtering must be performed server-side
- Validation must be performed server-side
- Statistics must be calculated from the database

Frontend validation and route protection should improve user experience, but they must not replace backend security.

---

## 3.3 Prevent Invalid State

The application should prefer preventing invalid data rather than trying to fix it later.

Examples:

- Unique database constraint for student submissions
- Unique email constraint
- Zod request validation
- Restricted submission status values
- Role-based authorization
- Whitelisted sorting fields

Important business rules should be protected at both application and database level where possible.

---

## 3.4 Security by Default

Authentication and authorization are required parts of the architecture.

Security requirements include:

- Password hashing
- JWT verification
- Protected API routes
- Role-Based Access Control
- Rate limiting
- Environment variables
- CORS configuration
- Helmet
- Server-side validation

Sensitive information must never be returned through API responses.

---

## 3.5 Server-Side Data Operations

The mentor dashboard may eventually contain many submissions.

Therefore the application should not download the entire dataset and manipulate it in the browser.

The following operations should run on the server:

- Pagination
- Filtering
- Searching
- Sorting
- Aggregation

The frontend should send query parameters describing the required dataset.

---

# 4. Core User Journey

## Student Journey

```text
Signup
   ↓
Login
   ↓
Student Dashboard
   ↓
Submit Project
   ↓
Validation
   ↓
Submission Created
   ↓
Status = PENDING
   ↓
View Submission Status
   ↓
Mentor Review
   ↓
APPROVED / REJECTED
```

---

## Mentor Journey

```text
Login
   ↓
Mentor Dashboard
   ↓
View Statistics
   ↓
View Submission Table
   ↓
Filter / Search / Paginate
   ↓
Open Submission
   ↓
Approve or Reject
   ↓
Optional Feedback
   ↓
Dashboard Refreshes
```

---

# 5. Functional Mission

The application must successfully deliver the following capabilities.

## Authentication

- Student signup
- Student login
- Mentor login
- JWT generation
- JWT verification
- Role-based authorization
- Current user endpoint

---

## Student Submission

Students must be able to submit:

- Project name
- GitHub repository URL
- Live project URL
- Project description

The submission process must include:

- Client-side validation
- Server-side validation
- Duplicate prevention
- Database uniqueness
- Rate limiting

---

## Mentor Review

Mentors must be able to:

- View all submissions
- View paginated results
- Filter by status
- Search submissions
- View statistics
- Approve submissions
- Reject submissions
- Add optional feedback

---

# 6. Quality Mission

The project should demonstrate production-aware engineering without unnecessary complexity.

The codebase should be:

- Strongly typed
- Modular
- Predictable
- Easy to navigate
- Easy to extend
- Consistent
- Testable

Business logic should not be duplicated unnecessarily between controllers and routes.

---

# 7. Backend Architecture Mission

Backend responsibilities should be clearly separated.

Recommended structure:

```text
Route
 ↓
Authentication
 ↓
Authorization
 ↓
Validation
 ↓
Controller
 ↓
Service
 ↓
Prisma ORM
 ↓
PostgreSQL
```

## Routes

Responsible for:

- Endpoint definitions
- Middleware composition

## Controllers

Responsible for:

- Reading request input
- Calling services
- Creating HTTP responses

## Services

Responsible for:

- Business logic
- Database operations
- Validation of business rules

## Middleware

Responsible for:

- Authentication
- Authorization
- Validation
- Rate limiting
- Error handling

---

# 8. Frontend Architecture Mission

The frontend should separate:

```text
Pages
Components
API services
Query logic
Validation schemas
Types
Providers
```

Pages should primarily compose features.

Avoid putting complex API logic directly inside UI components.

---

# 9. Data Integrity Mission

Database design should protect core rules.

Important constraints include:

```text
User.email → UNIQUE

Submission.studentId → UNIQUE
```

This guarantees:

- No duplicate student account emails
- No student can own multiple submissions

Submission status must be restricted to:

```text
PENDING
APPROVED
REJECTED
```

---

# 10. Performance Mission

The application does not require extreme optimization.

However, it should avoid obviously inefficient patterns.

Use:

- Server-side pagination
- Database indexes
- Query filtering
- Query sorting
- Parallel statistics queries where appropriate
- TanStack Query caching

Avoid:

- Fetching every submission
- Client-side filtering of the entire database
- Repeated unnecessary API requests
- N+1 database queries

---

# 11. UX Mission

The UI should feel straightforward and predictable.

Every important asynchronous action should communicate:

```text
Loading
Success
Failure
Empty state
```

Examples:

- Disable submit button while submitting
- Show skeleton while loading submissions
- Show confirmation before rejection
- Show toast after successful approval
- Show meaningful empty state when filters return no data

---

# 12. Accessibility Mission

Basic accessibility should be included from the beginning.

Requirements:

- Proper form labels
- Keyboard-accessible controls
- Visible focus states
- Accessible dialogs
- Status text alongside colors
- Clear validation errors

---

# 13. Repository Mission

The repository should be easy for reviewers to understand.

It should contain:

```text
README.md
specs.md
mission.md
roadmap.md
techstack.md
.env.example
Prisma schema
Migrations
Seed script
Frontend source
Backend source
```

The repository may remain private while development is ongoing.

After the submission deadline, it must be publicly accessible according to the assignment requirement.

---

# 14. Definition of Success

The project is successful when:

- A student can register and login
- A student can submit exactly one valid project
- Duplicate submissions are rejected
- Submission requests are rate-limited
- A mentor can login
- A mentor can view submissions
- Pagination works server-side
- Filtering works server-side
- Statistics reflect database state
- Mentor can approve submissions
- Mentor can reject submissions
- RBAC prevents unauthorized operations
- The application handles loading and error states cleanly
- The repository is understandable and runnable by another developer

---

# 15. Non-Goals

The first version is not intended to become:

- A full LMS
- A university management system
- A GitHub code review platform
- A project collaboration tool
- A messaging application
- A grading engine

The project should remain intentionally focused on:

```text
Submission
+
Review
+
Authentication
+
Basic administration
```

---

# 16. Long-Term Direction

If the core system is complete and stable, future versions may introduce:

- Submission deadlines
- Automatic repository visibility checks
- Review history
- Advanced analytics
- Email notifications
- Refresh token authentication
- Project editing before deadline
- Multiple reviewers
- Audit logging

These additions should only be considered after the core mission is complete.
