# Phase 02 Validations — PostgreSQL and Prisma

## Purpose

This document defines the checks required to confirm that Phase 02 has been implemented correctly.

A Phase 02 validation should verify the PostgreSQL connection, Prisma schema, constraints, indexes, migration, generated client, and consistency with `specs.md`.

---

# 1. Prisma Installation Validation

## Check

From the backend project, confirm Prisma is installed.

```bash
npm list prisma @prisma/client
```

## Pass Condition

Both packages are present without dependency errors.

Expected:

```text
prisma
@prisma/client
```

---

# 2. Prisma Schema File Validation

## Check

Confirm the file exists:

```text
server/prisma/schema.prisma
```

## Pass Condition

The file exists and contains:

- Prisma Client generator
- PostgreSQL datasource
- Required enums
- `User` model
- `Submission` model

---

# 3. PostgreSQL Provider Validation

## Check

Inspect `schema.prisma`.

Required:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Pass Condition

- Provider is `postgresql`
- Database URL comes from `DATABASE_URL`
- Credentials are not hard-coded

---

# 4. Environment Variable Validation

## Check

Confirm that the backend environment contains:

```env
DATABASE_URL=
```

## Pass Condition

- Variable exists locally
- Value is a valid PostgreSQL connection string
- `.env` is not committed to source control

Recommended check:

```bash
git check-ignore .env
```

Expected:

```text
.env
```

---

# 5. Database Connectivity Validation

## Check

Run:

```bash
npx prisma db pull
```

or use another Prisma command that establishes a real database connection.

## Pass Condition

Prisma can reach PostgreSQL without authentication, network, or connection-string errors.

If `db pull` would overwrite an intentional local schema, use an equivalent safe connectivity check instead.

---

# 6. UserRole Enum Validation

## Check

Confirm `schema.prisma` contains:

```prisma
enum UserRole {
  STUDENT
  MENTOR
}
```

## Pass Condition

Both values exist exactly as required:

```text
STUDENT
MENTOR
```

---

# 7. SubmissionStatus Enum Validation

## Check

Confirm `schema.prisma` contains:

```prisma
enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## Pass Condition

All three values exist exactly as required.

---

# 8. User Model Validation

## Check

Confirm the Prisma schema defines:

```prisma
model User {
  ...
}
```

Validate the model against `specs.md`.

## Pass Condition

- Required user fields exist
- Role uses `UserRole`
- Required timestamps exist
- Required relationships are defined
- Email uniqueness is enforced

---

# 9. User Email Unique Constraint Validation

## Check

Confirm the `email` field is unique in Prisma.

Expected pattern:

```prisma
email String @unique
```

## Pass Condition

The generated database migration creates a unique constraint/index for user email.

### Runtime Test

Attempt to insert two users with the same email.

Expected result:

```text
Second insert fails with unique constraint violation.
```

---

# 10. Submission Model Validation

## Check

Confirm the Prisma schema defines:

```prisma
model Submission {
  ...
}
```

Validate it against `specs.md`.

## Pass Condition

The model includes the fields and relations needed for later submission and review workflows.

---

# 11. Submission Student Uniqueness Validation

## Check

Confirm the schema enforces:

```text
Submission.studentId UNIQUE
```

Expected pattern:

```prisma
studentId String @unique
```

or an equivalent unique declaration.

## Pass Condition

The database rejects a second submission referencing the same student.

### Runtime Test

Insert:

```text
Submission A → studentId = student-1
Submission B → studentId = student-1
```

Expected:

```text
Submission A succeeds.
Submission B fails with a unique constraint violation.
```

---

# 12. Submission Status Index Validation

## Check

Confirm the `Submission` model contains an index for status.

Expected:

```prisma
@@index([status])
```

## Pass Condition

The generated migration creates an index for the submission status column.

---

# 13. Submission CreatedAt Index Validation

## Check

Confirm the `Submission` model contains an index for creation time.

Expected:

```prisma
@@index([createdAt])
```

## Pass Condition

The generated migration creates an index for the submission creation timestamp.

---

# 14. Relationship Validation

## Check

Run:

```bash
npx prisma validate
```

## Pass Condition

No relation errors occur.

Also confirm that the relation design supports:

```text
Student → at most one Submission
Submission → one Student
```

and any mentor review relation required by `specs.md`.

---

# 15. Prisma Format Validation

## Check

Run:

```bash
npx prisma format
```

Then check source control differences.

## Pass Condition

The schema formats successfully and remains valid.

---

# 16. Prisma Schema Validation

## Check

Run:

```bash
npx prisma validate
```

## Pass Condition

Expected result indicates the Prisma schema is valid.

There must be no errors involving:

- Datasource
- Environment variables
- Enums
- Models
- Relations
- Index definitions
- Unique constraints

---

# 17. Migration Validation

## Check

Run:

```bash
npx prisma migrate dev --name init
```

If the initial migration already exists, use:

```bash
npx prisma migrate status
```

## Pass Condition

- Migration executes successfully
- Database is in sync with migration history
- No failed migration remains

---

# 18. Migration Artifact Validation

## Check

Confirm the migration directory exists.

Example:

```text
prisma/
└── migrations/
    └── <timestamp>_init/
        └── migration.sql
```

## Pass Condition

`migration.sql` contains SQL for the intended Phase 02 schema.

Review it for:

- Enum creation
- User table creation
- Submission table creation
- Foreign keys
- Unique constraints
- Required indexes

---

# 19. Prisma Client Generation Validation

## Check

Run:

```bash
npx prisma generate
```

## Pass Condition

Prisma Client is generated without errors.

---

# 20. Prisma Client Runtime Validation

## Check

Create a temporary development-only script or use an existing safe backend entry point to import Prisma Client and perform a harmless query.

Conceptually:

```ts
const count = await prisma.user.count();
```

## Pass Condition

- Prisma Client imports successfully
- Database connection succeeds
- Query executes successfully

Remove temporary validation code if it is not part of the intended codebase.

---

# 21. Prisma Studio Validation

## Optional Check

Run:

```bash
npx prisma studio
```

## Pass Condition

Prisma Studio opens and exposes the expected models:

```text
User
Submission
```

Use this only as an inspection aid; it does not replace migration or schema validation.

---

# 22. Specification Consistency Validation

## Check

Compare `prisma/schema.prisma` line by line against the data model defined in `specs.md`.

Validate:

```text
[ ] Model names match
[ ] Field names match
[ ] Field types match
[ ] Required fields are non-nullable
[ ] Optional fields are nullable
[ ] Defaults match
[ ] Enum usage matches
[ ] Relations match
[ ] Unique constraints match
[ ] Indexes required by roadmap exist
```

## Pass Condition

The schema accurately represents the specification.

The roadmap's summary requirements must not be used to omit fields explicitly required by `specs.md`.

---

# 23. Out-of-Scope Validation

## Check

Review changes introduced in Phase 02.

## Pass Condition

Phase 02 does **not** depend on implementation of:

- Authentication routes
- JWT
- Authorization middleware
- Submission APIs
- Mentor APIs
- Frontend dashboards
- Seed logic
- Review actions

Database fields that are required to support those future features are allowed; the feature implementation itself is not.

---

# 24. Final Phase 02 Validation Checklist

```text
[ ] PostgreSQL database is reachable
[ ] DATABASE_URL works
[ ] Prisma packages are installed
[ ] prisma/schema.prisma exists
[ ] PostgreSQL datasource is configured
[ ] Prisma Client generator is configured
[ ] UserRole enum contains STUDENT and MENTOR
[ ] SubmissionStatus enum contains PENDING, APPROVED, REJECTED
[ ] User model exists
[ ] Submission model exists
[ ] User.email is unique
[ ] Submission.studentId is unique
[ ] Submission.status is indexed
[ ] Submission.createdAt is indexed
[ ] Required relations are valid
[ ] npx prisma format succeeds
[ ] npx prisma validate succeeds
[ ] Migration succeeds
[ ] Migration status is clean
[ ] Prisma Client generates
[ ] Prisma Client can query PostgreSQL
[ ] Database schema matches specs.md
```

---

# Phase 02 Completion Gate

Proceed to the next roadmap phase only when every mandatory validation above passes.

The required completion state is:

```text
Database connection works
Migration succeeds
Prisma Client works
Database schema matches specs.md
```
