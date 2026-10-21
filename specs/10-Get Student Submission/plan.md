# Phase 10 — Get Student Submission

## 1. Objective

Implement the authenticated student submission retrieval flow.

A logged-in user with the `STUDENT` role must be able to retrieve their own project submission from the backend and view it on the frontend.

The backend is the single source of truth for submission data. The frontend must fetch the submission using TanStack Query and must not depend on temporary client-side state for persistence.

---

## 2. Scope

### Backend

Implement:

```http
GET /api/submissions/me
```

Access:

```text
STUDENT
```

The endpoint must return the submission belonging to the currently authenticated student.

The response must include:

- Submission ID
- Project name
- Repository URL
- Live URL
- Description
- Submission status
- Reviewer feedback
- Review timestamp
- Relevant submission timestamps

### Frontend

Implement a TanStack Query for the authenticated student's submission.

Query key:

```ts
["mySubmission"];
```

The student submission page must display:

- Project name
- Repository link
- Live project link
- Description
- Status
- Feedback
- Review timestamp when available

---

## 3. Backend Implementation Plan

### Step 1 — Add Submission Route

Register the route:

```http
GET /api/submissions/me
```

The route must be protected by authentication middleware.

It must also require the authenticated user to have:

```text
STUDENT
```

role access.

Important:

`/me` must not be interpreted as a dynamic submission ID.

If routes such as the following exist:

```http
GET /api/submissions/:id
```

ensure `/me` is registered before the dynamic route when required by the routing framework.

---

### Step 2 — Resolve Authenticated Student

Use the authenticated user context established by the authentication middleware.

Example conceptual flow:

```text
Request
  ↓
Authentication middleware
  ↓
Role authorization
  ↓
Authenticated user ID
  ↓
Find submission owned by user
```

Never accept a student/user ID from:

- Query parameters
- Request body
- Route parameters

for this endpoint.

The authenticated identity must determine which submission is returned.

---

### Step 3 — Retrieve Submission

Query the database using the authenticated student's identity.

Conceptually:

```ts
submission.studentId === authenticatedUser.id;
```

Use the actual ownership relationship defined by the project's database schema.

If the application allows only one submission per student, retrieve that submission directly.

Do not retrieve another student's submission under any circumstances.

---

### Step 4 — Return Submission DTO

Return a normalized response containing only the information required by the frontend.

Example:

```json
{
  "id": "submission-id",
  "projectName": "Project Review Dashboard",
  "repoUrl": "https://github.com/example/project",
  "liveUrl": "https://example.com",
  "description": "Project description",
  "status": "PENDING",
  "feedback": null,
  "reviewedAt": null,
  "submittedAt": "2026-10-21T10:00:00.000Z",
  "createdAt": "2026-10-21T10:00:00.000Z",
  "updatedAt": "2026-10-21T10:00:00.000Z"
}
```

Field names should follow the conventions already established by the project.

Do not introduce a second response convention solely for this endpoint.

---

### Step 5 — Handle Missing Submission

If the authenticated student has not submitted a project, return the project's standard not-found response.

Recommended HTTP status:

```http
404 Not Found
```

Example:

```json
{
  "message": "Submission not found"
}
```

The frontend must distinguish this state from an unexpected server failure.

---

### Step 6 — Authorization

Ensure the endpoint cannot be accessed by unauthorized roles.

Examples:

```text
ADMIN   → forbidden
REVIEWER → forbidden
STUDENT → allowed
```

Use the existing RBAC/authorization infrastructure rather than implementing endpoint-specific authorization logic if such infrastructure already exists.

---

## 4. Frontend Implementation Plan

### Step 1 — Create Submission API Function

Create or extend the submission API/service layer with a function responsible for retrieving the authenticated student's submission.

Conceptually:

```ts
getMySubmission();
```

It should call:

```http
GET /api/submissions/me
```

Use the project's existing authenticated HTTP client.

Do not manually manage authentication differently from other protected API requests.

---

### Step 2 — Define Submission Types

Define or reuse the TypeScript representation of the submission.

Conceptually:

```ts
type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Submission {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string | null;
  description: string;
  status: SubmissionStatus;
  feedback: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

The exact status values must match the backend/database schema.

Do not create frontend-only status values.

---

### Step 3 — Create TanStack Query

Create a reusable query/hook for the student's submission.

Required query key:

```ts
["mySubmission"];
```

Conceptually:

```ts
useQuery({
  queryKey: ["mySubmission"],
  queryFn: getMySubmission,
});
```

Prefer placing the query implementation in the project's existing query/hook architecture.

---

### Step 4 — Remove Local Submission State Dependency

The submission page must not depend on:

```ts
useState(...)
```

or similar temporary state as the source of truth for previously submitted information.

Do not rely on:

```text
localStorage
sessionStorage
navigation state
previous component state
```

to determine whether a submission exists.

Submission information must originate from:

```http
GET /api/submissions/me
```

---

### Step 5 — Implement Loading State

While the query is pending, display the project's standard loading UI.

For example:

```text
Loading submission...
```

or an existing skeleton component.

Do not briefly render a "No submission" state while the query is still loading.

---

### Step 6 — Implement Submission Display

After successfully retrieving the submission, render:

```text
Project Name
Repository
Live Project
Description
Status
Feedback
Review Date
```

Repository and live URLs should be rendered as clickable links.

External links should follow the project's existing external-link behavior.

---

### Step 7 — Implement Status UI

Render the submission status using the project's existing badge/status component.

Examples may include:

```text
PENDING
APPROVED
REJECTED
```

UI labels may be human-readable:

```text
Pending
Approved
Rejected
```

but the underlying values must remain consistent with the backend.

---

### Step 8 — Handle Feedback

If reviewer feedback exists, display it.

If:

```ts
feedback === null;
```

render an appropriate empty state such as:

```text
No feedback yet.
```

Do not display:

```text
null
undefined
```

to the student.

---

### Step 9 — Handle Review Timestamp

If:

```ts
reviewedAt !== null;
```

format and display the timestamp.

If the submission has not been reviewed, the review timestamp may be omitted or represented as:

```text
Not reviewed yet
```

Use the project's existing date formatting utilities when available.

---

### Step 10 — Handle No Submission State

When the API indicates that no submission exists, display an appropriate empty state.

Example:

```text
You haven't submitted a project yet.
```

If the application has a submission form, provide the existing navigation/action for creating a submission.

---

### Step 11 — Handle Unexpected Errors

Unexpected failures should display the project's standard error UI.

Possible failures include:

```text
Network error
500 server error
Authentication failure
Unexpected API response
```

Do not treat every API error as "No submission."

---

## 5. Cache Synchronization

The following query key is the canonical cache entry:

```ts
["mySubmission"];
```

Any mutation that changes the student's submission should synchronize this query.

For example, after creating or updating a submission:

```ts
queryClient.invalidateQueries({
  queryKey: ["mySubmission"],
});
```

Alternatively, update the cache directly when appropriate.

The goal is to prevent stale submission information after mutations.

---

## 6. Refresh Behavior

The implementation must support:

```text
Submit project
      ↓
View submission
      ↓
Refresh browser
      ↓
GET /api/submissions/me
      ↓
Database
      ↓
Submission rendered again
```

Refreshing the page must not cause the application to forget that the student has submitted a project.

The database/backend remains the persistent source of truth.

---

## 7. Recommended Implementation Order

1. Inspect existing submission database schema.
2. Inspect authentication and RBAC middleware.
3. Add `GET /api/submissions/me`.
4. Implement submission ownership lookup.
5. Implement backend response/error handling.
6. Test authentication and authorization.
7. Add/update frontend submission types.
8. Add `getMySubmission()` API function.
9. Create TanStack Query using `["mySubmission"]`.
10. Connect the submission page to the query.
11. Implement loading state.
12. Implement no-submission state.
13. Implement error state.
14. Render submission details.
15. Render status and feedback.
16. Render review timestamp.
17. Invalidate/update `["mySubmission"]` after submission mutations.
18. Test browser refresh behavior.
19. Run lint/type-check/tests.

---

## 8. Definition of Done

Phase 10 is complete when:

- `GET /api/submissions/me` exists.
- Authentication is required.
- Only students can access the endpoint.
- Students can retrieve only their own submission.
- Submission information comes from the database.
- Frontend uses TanStack Query.
- Query key is `["mySubmission"]`.
- Project details are displayed correctly.
- Status is displayed correctly.
- Feedback is displayed correctly.
- Review timestamp is displayed when available.
- Missing feedback is handled safely.
- Missing review timestamp is handled safely.
- Missing submission has an appropriate UI state.
- Unexpected errors have an appropriate UI state.
- Refreshing the browser preserves the visible submission state by refetching it from the backend.
- No client-side temporary state is used as the persistent source of truth.
