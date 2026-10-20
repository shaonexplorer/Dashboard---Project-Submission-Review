# Phase 9 — Student Submission Frontend Requirements

## 1. Functional Requirements

### REQ-STU-FE-001 — Student Dashboard

The application must provide:

```text
/student/dashboard
```

as the primary dashboard for student submission functionality.

---

### REQ-STU-FE-002 — Protected Access

The dashboard must require authentication.

Only:

```text
STUDENT
```

users should have access to the student submission workflow.

Frontend authorization must complement, not replace, backend authorization.

---

### REQ-STU-FE-003 — Existing Submission Detection

When the dashboard loads, the application must determine whether the current student already has a submission.

Possible states:

```text
Loading
No submission
Submission exists
Error
```

The form must only appear after the application determines that no submission exists.

---

### REQ-STU-FE-004 — Submission Form

Students without an existing submission must see a form containing:

```text
Project Name
Repository URL
Live Link
Description
```

Field names must map to:

```text
projectName
repoUrl
liveUrl
description
```

---

### REQ-STU-FE-005 — React Hook Form

Form state must be managed using:

```text
React Hook Form
```

---

### REQ-STU-FE-006 — Zod Validation

The submission form must use:

```text
Zod
```

for client-side schema validation.

React Hook Form should integrate with Zod using the appropriate resolver.

---

### REQ-STU-FE-007 — ShadCN Form

The form interface must use the project's ShadCN form components.

Validation errors should appear near their corresponding fields.

---

### REQ-STU-FE-008 — Submission Mutation

Submission creation must use a:

```text
TanStack Query mutation
```

The mutation must call:

```http
POST /api/submissions
```

---

### REQ-STU-FE-009 — Request Payload

The frontend must send:

```json
{
  "projectName": "...",
  "repoUrl": "...",
  "liveUrl": "...",
  "description": "..."
}
```

The frontend must not determine submission ownership.

Therefore it must not treat client-provided:

```text
studentId
```

as authoritative.

---

### REQ-STU-FE-010 — Pending State

While submission is being processed:

- Submit button must be disabled
- Loading feedback must be shown
- Accidental repeated submission must be prevented

Example:

```text
Submitting...
```

---

### REQ-STU-FE-011 — Successful Submission

After successful creation:

```http
201 Created
```

the application must:

```text
Hide submission form
Display submitted project
Display submission status
```

A full page reload should not be required.

---

### REQ-STU-FE-012 — Submitted Project

The submitted-project view must display relevant submission information:

```text
Project Name
Repository URL
Live Link
Description
Status
```

---

### REQ-STU-FE-013 — Status Badge

The current submission status must be displayed using a visual badge.

Use the status returned by the backend.

The frontend must not independently invent a different submission status.

---

### REQ-STU-FE-014 — Persistent UI State

After a successful submission, refreshing `/student/dashboard` must continue to show the existing submission instead of showing an empty form.

Backend state must therefore determine whether the form or submitted-project view is displayed.

---

## 2. Validation Requirements

### REQ-VAL-001

`projectName` is required.

### REQ-VAL-002

`projectName` must not contain only whitespace.

### REQ-VAL-003

`repoUrl` is required.

### REQ-VAL-004

`repoUrl` must be a valid HTTP/HTTPS URL.

### REQ-VAL-005

If Phase 8 requires GitHub repositories specifically, frontend validation should enforce the same hostname requirement.

### REQ-VAL-006

`liveUrl` is required.

### REQ-VAL-007

`liveUrl` must be a valid HTTP/HTTPS URL.

### REQ-VAL-008

`description` is required.

### REQ-VAL-009

`description` must not contain only whitespace.

### REQ-VAL-010

Client-side validation rules should align with backend rules to minimize cases where the browser accepts data that the API rejects.

---

## 3. API Error Requirements

The frontend must appropriately handle:

| Status | Meaning                   | UI Behavior                    |
| ------ | ------------------------- | ------------------------------ |
| `400`  | Invalid submission        | Show validation/error feedback |
| `401`  | Unauthenticated           | Use authentication flow        |
| `403`  | Unauthorized role         | Prevent student workflow       |
| `409`  | Submission already exists | Refetch/synchronize submission |
| `429`  | Too many requests         | Show rate-limit message        |
| `500`  | Server error              | Show generic failure message   |

---

## 4. UX Requirements

### REQ-UX-001

Every form field must have a visible label.

### REQ-UX-002

Validation messages should appear close to the relevant input.

### REQ-UX-003

The submission button must clearly communicate its normal and pending states.

### REQ-UX-004

The form must not briefly appear while an existing submission is still being fetched.

### REQ-UX-005

Repository and live-project URLs should be easily accessible from the submitted-project view.

### REQ-UX-006

The UI must provide clear feedback when submission succeeds or fails.

### REQ-UX-007

The form should preserve entered values when a recoverable server error occurs.

---

## 5. State Management Requirements

Use:

```text
React Hook Form
→ Local form state

TanStack Query
→ Server state

Zod
→ Validation

Existing auth system
→ Authentication/user state
```

Do not introduce unnecessary duplicated state.

For example, avoid maintaining:

```ts
const [submission, setSubmission] = useState(...)
```

when the same state is already managed through the TanStack Query cache.

---

## 6. Security Requirements

The frontend must never assume client-side route protection provides sufficient security.

The backend remains responsible for:

```text
Authentication
Role authorization
Duplicate protection
Rate limiting
Database constraints
```

The frontend must not send or allow modification of protected fields such as:

```text
studentId
role
```

unless a future API explicitly requires them.

---

## 7. Accessibility Requirements

Form fields should:

- Have associated labels
- Expose validation errors appropriately
- Support keyboard navigation
- Preserve visible focus states
- Use semantic controls

ShadCN/Radix accessibility behavior should not be intentionally bypassed.

---

## 8. Technical Requirements

Implementation must use:

```text
TypeScript
Next.js
TailwindCSS
ShadCN
React Hook Form
Zod
TanStack Query
```

Types should be inferred from Zod where appropriate.

Example:

```ts
type SubmissionFormValues = z.infer<typeof submissionSchema>;
```

---

## 9. Backend Dependency

The dashboard requires a reliable way to retrieve the authenticated student's existing submission.

Conceptually:

```http
GET /api/submissions/me
```

or an equivalent endpoint already defined elsewhere in the application.

This is required to correctly determine:

```text
show form
vs.
show existing submission
```

after page refresh or a new session.

If this endpoint does not yet exist, it should be introduced or scheduled as a backend dependency for Phase 9.

---

## 10. Acceptance Criteria

Phase 9 is accepted when:

```text
✓ Student can access /student/dashboard
✓ Non-student cannot use the submission workflow
✓ Student without submission sees the form
✓ Existing submission is detected
✓ Existing student does not see another submission form
✓ Form uses React Hook Form
✓ Form uses Zod validation
✓ Form uses ShadCN components
✓ Submission uses TanStack Query mutation
✓ Invalid fields show errors
✓ Valid form reaches POST /api/submissions
✓ Pending mutation disables repeated submission
✓ Successful submission hides the form
✓ Submitted project appears immediately
✓ Submission status badge appears
✓ Refresh preserves submitted-project state
✓ Duplicate responses are handled
✓ Rate-limit responses are handled
✓ Student can complete the workflow entirely through the UI
```
