# Phase 02 Requirements — PostgreSQL and Prisma

## 1. Purpose

Phase 02 must create the persistent database foundation for the project using PostgreSQL and Prisma.

The result of this phase must be a valid relational schema that can support authentication, student submissions, mentor review, filtering, sorting, statistics, and later backend features without implementing those features yet.

---

## 2. Technology Requirements

The database layer must use:

```text
PostgreSQL
Prisma ORM
Prisma Client
```

Prisma must be configured inside the backend/server project.

---

## 3. Required Prisma File

The project must contain:

```text
server/prisma/schema.prisma
```

If the repository uses `server/` as the backend directory, all Prisma schema and migration files must live under that backend project.

---

## 4. Environment Requirements

The backend must define a PostgreSQL connection through:

```env
DATABASE_URL=
```

Requirements:

- `DATABASE_URL` must be read from the environment.
- Database credentials must not be hard-coded into source files.
- The connection string must point to a PostgreSQL database.
- The value must not be committed to source control.

The Prisma datasource must reference:

```prisma
url = env("DATABASE_URL")
```

---

## 5. Prisma Datasource Requirement

The schema must define PostgreSQL as the datasource provider.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 6. Prisma Client Requirement

The schema must define a Prisma Client generator.

```prisma
generator client {
  provider = "prisma-client-js"
}
```

Prisma Client generation must succeed.

---

## 7. Required User Role Enum

The schema must implement:

```prisma
enum UserRole {
  STUDENT
  MENTOR
}
```

No additional roles are required by Phase 02.

The exact values must remain compatible with later role-based authentication and authorization.

---

## 8. Required Submission Status Enum

The schema must implement:

```prisma
enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}
```

These values will later support submission filtering and mentor review actions.

---

## 9. User Model Requirements

The Prisma schema must include a `User` model.

The exact fields must follow `specs.md`, but the model must support the project's later workflows.

Required characteristics include:

- A unique primary identifier
- User full name
- Email
- Password hash
- Role using `UserRole`
- Creation timestamp
- Update timestamp
- Relations needed for student submission ownership
- Relations needed for mentor review metadata where specified

### 9.1 Email Constraint

The following database rule is mandatory:

```text
User.email UNIQUE
```

The uniqueness must be enforced by PostgreSQL through the Prisma schema, not only through application code.

---

## 10. Submission Model Requirements

The Prisma schema must include a `Submission` model.

The exact field set must match `specs.md` and support later project functionality.

The model must support data for:

- Submission ID
- Student ownership
- Project name
- Repository URL
- Live URL
- Description
- Submission status
- Feedback where defined
- Review timestamp where defined
- Reviewer reference where defined
- Creation timestamp
- Update timestamp

---

## 11. Student Submission Uniqueness Requirement

The following constraint is mandatory:

```text
Submission.studentId UNIQUE
```

This must be a database-level unique constraint.

Purpose:

```text
One student → at most one submission
```

Later application-level duplicate checks do not replace this requirement.

---

## 12. Relationship Requirements

The schema must define valid relations between `User` and `Submission` according to `specs.md`.

The relationship model must support:

```text
Student → Submission
Submission → Student
```

Where mentor review metadata is part of the specification, the schema must also support the reviewer relationship.

Foreign keys must be valid and migrations must create them successfully.

---

## 13. Submission Status Index Requirement

The schema must create an index for:

```text
Submission.status
```

Purpose:

- Support later status filtering
- Support mentor dashboard queries
- Support status-based statistics/query efficiency

Expected Prisma pattern:

```prisma
@@index([status])
```

---

## 14. Submission Creation Date Index Requirement

The schema must create an index for:

```text
Submission.createdAt
```

Purpose:

- Support later sorting
- Support paginated mentor submission lists
- Support date-based query efficiency

Expected Prisma pattern:

```prisma
@@index([createdAt])
```

---

## 15. Migration Requirement

At least one migration must be generated and successfully applied for the Phase 02 schema.

Expected command pattern:

```bash
npx prisma migrate dev --name init
```

The generated migration must create the expected schema without manual database changes being required.

---

## 16. Prisma Client Generation Requirement

The project must successfully run:

```bash
npx prisma generate
```

No schema or generator errors may remain.

---

## 17. Schema Validation Requirement

The project must successfully run:

```bash
npx prisma validate
```

The schema must be syntactically and relationally valid.

---

## 18. Schema Formatting Requirement

The schema should be formatted using:

```bash
npx prisma format
```

The committed Prisma schema should be clean and consistently formatted.

---

## 19. Specification Consistency Requirement

The final Prisma schema must match the data model defined by `specs.md`.

Phase 02 must not knowingly introduce incompatible:

- Fields
- Enum values
- Relations
- Nullability rules
- Default values
- Uniqueness rules

If `specs.md` defines additional model fields beyond the roadmap summary, those fields should be included because the roadmap explicitly requires the database schema to match `specs.md`.

---

## 20. Out-of-Scope Requirements

The following are **not** part of Phase 02:

- Express controllers
- API endpoints
- Authentication routes
- JWT generation
- Password hashing implementation
- Prisma singleton/service architecture
- Global backend error handling
- Student submission APIs
- Mentor APIs
- Frontend authentication
- Frontend dashboards
- Seed implementation
- Rate limiting

Those belong to later roadmap phases.

---

## 21. Acceptance Requirements

Phase 02 is accepted only when:

```text
[ ] PostgreSQL connection works
[ ] Prisma is installed
[ ] prisma/schema.prisma exists
[ ] UserRole enum is implemented
[ ] SubmissionStatus enum is implemented
[ ] User model is implemented
[ ] Submission model is implemented
[ ] User.email has a unique constraint
[ ] Submission.studentId has a unique constraint
[ ] Submission.status has an index
[ ] Submission.createdAt has an index
[ ] Relations are valid
[ ] Prisma schema validates
[ ] Migration succeeds
[ ] Prisma Client generates
[ ] Database schema matches specs.md
```
