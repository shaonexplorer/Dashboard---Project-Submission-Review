# Phase 02 Plan — PostgreSQL and Prisma

## Objective

Establish the project's persistent data layer using PostgreSQL and Prisma so later backend features can rely on a stable, validated schema.

## Phase Scope

This phase covers:

- PostgreSQL database connectivity
- Prisma installation and configuration
- Prisma schema creation
- Required enums
- `User` and `Submission` models
- Required unique constraints
- Required indexes
- Initial database migration
- Prisma Client generation
- Verification that the schema matches the project specification

This phase does **not** include authentication, API routes, controllers, services, authorization, frontend forms, or submission workflows.

---

## 1. Install Prisma Dependencies

Inside the backend/server project, install Prisma and Prisma Client.

Expected packages:

```bash
npm install @prisma/client
npm install -D prisma
```

Initialize Prisma:

```bash
npx prisma init
```

Expected result:

```text
server/
├── prisma/
│   └── schema.prisma
└── .env
```

---

## 2. Configure PostgreSQL Connection

Set the PostgreSQL connection string through the environment variable:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

The Prisma datasource must use PostgreSQL and read the database URL from the environment.

Example:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Do not hard-code credentials inside `schema.prisma`.

---

## 3. Configure Prisma Client Generator

Define the Prisma Client generator in `prisma/schema.prisma`.

```prisma
generator client {
  provider = "prisma-client-js"
}
```

This prepares the backend to access PostgreSQL through Prisma Client in later phases.

---

## 4. Implement Required Enums

Create the role enum:

```prisma
enum UserRole {
  STUDENT
  MENTOR
}
```

Create the submission status enum:

```prisma
enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}
```

These enum values must match the roadmap exactly because later authentication, authorization, filtering, and review workflows depend on them.

---

## 5. Implement the User Model

Create the `User` model required by the project specification.

At minimum, the model must support the fields and relationships required by later phases, including:

- Unique user identifier
- Full name
- Email
- Password hash
- User role
- Timestamps
- Student submission relationship
- Mentor review relationship where required by the specification

Critical constraint:

```text
User.email UNIQUE
```

Prisma must enforce the email uniqueness at database level.

---

## 6. Implement the Submission Model

Create the `Submission` model required by the project specification.

The model should support the submission and review data needed by later roadmap phases, including:

- Unique submission identifier
- Student reference
- Project name
- Repository URL
- Live URL
- Description
- Submission status
- Optional feedback
- Review metadata where required by the specification
- Created/updated timestamps

Critical constraint:

```text
Submission.studentId UNIQUE
```

This database-level constraint enforces the one-submission-per-student rule required later in the submission workflow.

---

## 7. Configure Model Relationships

Define the Prisma relations between `User` and `Submission` according to the project specification.

The relation design must support:

- A student owning at most one submission
- A submission belonging to one student
- Review metadata involving a mentor where defined in the specification

Relations must have explicit foreign keys and appropriate Prisma relation definitions.

---

## 8. Add Required Database Indexes

Create indexes for:

```text
Submission.status
Submission.createdAt
```

Example Prisma declarations:

```prisma
@@index([status])
@@index([createdAt])
```

These indexes prepare the database for later mentor filtering, sorting, pagination, and statistics operations.

---

## 9. Format and Validate the Prisma Schema

Run:

```bash
npx prisma format
```

Then validate:

```bash
npx prisma validate
```

Resolve any schema errors before creating a migration.

---

## 10. Create and Run the Initial Migration

Run the first migration after the schema is complete.

Example:

```bash
npx prisma migrate dev --name init
```

Expected result:

```text
prisma/
├── schema.prisma
└── migrations/
    └── <timestamp>_init/
        └── migration.sql
```

The migration must complete without errors.

---

## 11. Generate Prisma Client

Generate Prisma Client:

```bash
npx prisma generate
```

The command must finish successfully.

This verifies that the schema can produce a usable typed database client for later backend phases.

---

## 12. Verify Database State

Confirm that PostgreSQL contains the expected tables, enum types, indexes, foreign keys, and unique constraints.

Optional local inspection:

```bash
npx prisma studio
```

Verify that:

- `User` exists
- `Submission` exists
- Role values are `STUDENT` and `MENTOR`
- Submission status values are `PENDING`, `APPROVED`, and `REJECTED`
- User email is unique
- Student submission ownership is unique
- Required indexes exist

---

## 13. Verify Schema Against Project Specification

Before closing Phase 02, compare `prisma/schema.prisma` against the project's `specs.md`.

Confirm:

- Required fields are present
- Field types are correct
- Optional fields are correctly nullable
- Default values are correct
- Relations match the intended workflow
- Uniqueness rules match the specification
- Required indexes are present

Do not introduce additional business logic into this phase.

---

## Recommended Execution Order

```text
Install Prisma
      ↓
Configure DATABASE_URL
      ↓
Create datasource + generator
      ↓
Define enums
      ↓
Define User model
      ↓
Define Submission model
      ↓
Configure relations
      ↓
Add unique constraints
      ↓
Add indexes
      ↓
Prisma format + validate
      ↓
Create migration
      ↓
Generate Prisma Client
      ↓
Verify PostgreSQL schema
      ↓
Compare against specs.md
```

---

## Phase 02 Definition of Done

Phase 02 is complete only when all of the following are true:

- PostgreSQL connection works
- Prisma is installed and initialized
- `prisma/schema.prisma` exists
- `UserRole` enum exists
- `SubmissionStatus` enum exists
- `User` model exists
- `Submission` model exists
- `User.email` is unique
- `Submission.studentId` is unique
- `Submission.status` is indexed
- `Submission.createdAt` is indexed
- Prisma schema validates successfully
- Initial migration succeeds
- Prisma Client generates successfully
- Database schema matches `specs.md`
