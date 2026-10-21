# Phase 10 — Requirements

## 1. Functional Requirements

### FR-01 — Student Submission Endpoint

The backend must expose:

```http
GET /api/submissions/me
```

The endpoint must retrieve the submission associated with the currently authenticated student.

---

### FR-02 — Authentication

The endpoint must require authentication.

Unauthenticated requests must not receive submission information.

Expected response should follow the project's authentication convention, typically:

```http
401 Unauthorized
```

---

### FR-03 — Student Role Authorization

Only users with the following role may access the endpoint:

```text
STUDENT
```

Authenticated users without the required role must receive the project's standard authorization error, typically:

```http
403 Forbidden
```

---

### FR-04 — Submission Ownership

The endpoint must derive the student identity from the authenticated request context.

The API must not accept another student's identifier to determine which submission to retrieve.

A student must never be able to retrieve another student's submission through this endpoint.

---

### FR-05 — Submission Data

The API response must provide the data necessary to display:

```text
Project name
Repository URL
Live URL
Description
Status
Feedback
Review timestamp
```

Additional identifiers and timestamps may be returned when consistent with the project's API conventions.

---

### FR-06 — Submission Status

The returned status must correspond to the status stored by the backend/database.

The frontend must not infer submission status independently.

The frontend must not maintain a separate persistent status value.

---

### FR-07 — Reviewer Feedback

Reviewer feedback must be returned when feedback exists.

Feedback may be nullable when the submission has not received feedback.

Example:

```json
{
  "feedback": null
}
```

---

### FR-08 — Review Timestamp

The API must return the review timestamp when the submission has been reviewed.

The value may be nullable when no review has occurred.

Example:

```json
{
  "reviewedAt": null
}
```

---

### FR-09 — Missing Submission

The backend must provide a deterministic response when the authenticated student has no submission.

Recommended response:

```http
404 Not Found
```

Example:

```json
{
  "message": "Submission not found"
}
```

The response must follow existing project error conventions.

---

## 2. Frontend Requirements

### FR-10 — TanStack Query

The frontend must retrieve submission information using TanStack Query.

Required query key:

```ts
["mySubmission"];
```

---

### FR-11 — Backend Source of Truth

The frontend must treat the backend as the source of truth for submission information.

The frontend must not use any of the following as the authoritative persistent source:

```text
React local state
localStorage
sessionStorage
route/navigation state
hardcoded submission objects
```

---

### FR-12 — Refresh Persistence

Refreshing the browser must trigger or restore the TanStack Query lifecycle and retrieve the student's submission from the backend.

The application must continue displaying the student's submission after a refresh when the submission exists in the database.

---

### FR-13 — Submission Details UI

The frontend must display:

- Project name
- Repository link
- Live project link
- Description
- Submission status
- Reviewer feedback

The review timestamp must also be displayed when applicable.

---

### FR-14 — Repository Link

The repository URL must be rendered as a usable link.

The displayed link must correspond to the repository URL returned by the backend.

---

### FR-15 — Live Link

When a live URL exists, it must be rendered as a usable link.

When no live URL exists, the UI must handle the missing value gracefully.

It must not render invalid values such as:

```text
null
undefined
```

---

### FR-16 — Loading State

The frontend must display a loading state while the submission request is pending.

The UI must not incorrectly display the no-submission state before the request completes.

---

### FR-17 — No Submission State

When the backend indicates that the student has no submission, the frontend must display an appropriate empty state.

Example:

```text
You haven't submitted a project yet.
```

---

### FR-18 — Error State

Unexpected API failures must be represented separately from the no-submission state.

The UI must distinguish between:

```text
Submission does not exist
```

and:

```text
Submission could not be loaded
```

---

### FR-19 — Feedback Empty State

When feedback is unavailable, the UI must display a suitable fallback.

Example:

```text
No feedback yet.
```

---

### FR-20 — Review Date

When a review timestamp exists, the frontend must convert it into a human-readable representation.

When it does not exist, the UI must handle the nullable value safely.

---

## 3. Data Requirements

The frontend submission model should contain the fields required by the UI.

Conceptual model:

```ts
interface Submission {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string | null;
  description: string;
  status: SubmissionStatus;
  feedback: string | null;
  reviewedAt: string | null;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

Exact field names must match the backend contract.

---

## 4. Security Requirements

### SR-01 — Authentication Required

Submission data must never be returned to an unauthenticated request.

### SR-02 — Role Enforcement

The backend must enforce `STUDENT` authorization independently of frontend route protection.

### SR-03 — Ownership Enforcement

Submission lookup must use the authenticated student's identity.

### SR-04 — No Arbitrary Student Selection

The endpoint must not support:

```http
GET /api/submissions/me?studentId=...
```

or equivalent mechanisms that allow the client to choose the submission owner.

### SR-05 — Response Exposure

The API must return only submission information appropriate for the student-facing UI.

Internal reviewer/admin-only metadata should not be exposed unless explicitly required by the application's API contract.

---

## 5. State Management Requirements

The canonical query key is:

```ts
["mySubmission"];
```

Submission-related mutations must keep this query synchronized.

After submission creation or modification, use cache invalidation or a direct cache update.

Example:

```ts
queryClient.invalidateQueries({
  queryKey: ["mySubmission"],
});
```

The implementation must avoid maintaining two independent sources of truth for the same submission.

---

## 6. Non-Functional Requirements

### NFR-01 — Type Safety

Frontend API responses and query results must be properly typed with TypeScript.

Avoid unnecessary use of:

```ts
any;
```

---

### NFR-02 — Consistency

The implementation must reuse existing:

- API response conventions
- Error handling
- Authentication middleware
- RBAC middleware
- API client
- UI components
- Date formatting utilities
- TanStack Query conventions

when available.

---

### NFR-03 — Maintainability

Backend logic should follow the project's established architecture, such as:

```text
Route
→ Controller
→ Service
→ Database
```

when that architecture already exists.

Do not introduce unnecessary architectural layers solely for this phase.

---

### NFR-04 — Accessibility

Repository and live-project links must be identifiable and keyboard accessible.

Status information must not depend exclusively on color.

---

### NFR-05 — Reliability

Submission data shown after a browser refresh must represent the current backend/database state.

---

## 7. Acceptance Requirements

The implementation is accepted when all of the following are true:

```text
Authenticated STUDENT
        ↓
GET /api/submissions/me
        ↓
Own submission retrieved
        ↓
TanStack Query ["mySubmission"]
        ↓
Submission UI rendered
```

Additionally:

- Unauthorized users cannot access the endpoint.
- Other roles cannot use the student endpoint.
- Students cannot retrieve another student's submission.
- Refreshing the page does not lose submission state.
- Status originates from the backend.
- Feedback originates from the backend.
- Review timestamp originates from the backend.
- Null values are handled safely.
- Loading, empty, success, and error states are distinguishable.
