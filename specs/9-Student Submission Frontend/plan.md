# Phase 9 — Student Submission Frontend Implementation Plan

## 1. Objective

Implement the student dashboard and complete the project submission workflow through the frontend.

The dashboard must allow an authenticated student to:

- Navigate to `/student/dashboard`
- View the project submission form when no submission exists
- Enter project information
- Receive client-side validation feedback
- Submit the project to the backend
- See loading and error states
- Hide the form after successful submission
- View the submitted project
- View the submission status

---

## 2. Route

```text
/student/dashboard
```

The route must be protected and available only to authenticated users with the:

```text
STUDENT
```

role.

Frontend route protection improves UX, while backend authorization remains the source of truth for security.

---

## 3. Submission Form

The form must contain:

```text
Project Name
Repository URL
Live Link
Description
```

Suggested field mapping:

```text
Project Name    → projectName
Repository URL  → repoUrl
Live Link       → liveUrl
Description     → description
```

These field names should match the Phase 8 backend API contract.

---

## 4. Required Frontend Technologies

Use:

```text
React Hook Form
Zod
ShadCN Form
TanStack Query
TypeScript
```

Recommended responsibilities:

```text
React Hook Form
    ↓
Form state and field handling

Zod
    ↓
Client-side schema validation

ShadCN Form
    ↓
Form UI and validation messages

TanStack Query
    ↓
Server state, fetching, mutation and cache synchronization
```

---

## 5. High-Level Page Flow

```text
/student/dashboard
        │
        ▼
Verify authenticated STUDENT
        │
        ▼
Load existing submission
        │
        ├── Loading
        │      ↓
        │   Show skeleton/loading UI
        │
        ├── Submission exists
        │      ↓
        │   Show submitted project
        │
        └── No submission
               ↓
          Show submission form
               ↓
          Student completes form
               ↓
          Zod validation
               │
               ├── Invalid
               │      ↓
               │   Show field errors
               │
               └── Valid
                      ↓
                TanStack mutation
                      ↓
              POST /api/submissions
                      │
              ┌───────┴────────┐
              │                │
           Success           Error
              │                │
              ▼                ▼
        Update cache       Show error
              │
              ▼
         Hide form
              │
              ▼
     Show submitted project
              │
              ▼
        Show status badge
```

---

## 6. Implementation Steps

### Step 1 — Create Student Dashboard Route

Implement:

```text
/student/dashboard
```

The page should use the existing application dashboard layout, navigation and authentication architecture.

Do not create a separate authentication mechanism specifically for this page.

---

### Step 2 — Protect Student Route

The route must only be accessible to authenticated students.

Expected frontend behavior:

```text
Unauthenticated
    → redirect to login

Authenticated STUDENT
    → dashboard

Authenticated non-STUDENT
    → unauthorized page or role-appropriate dashboard
```

The exact redirect behavior should follow existing application conventions.

---

### Step 3 — Create Submission Schema

Create a shared frontend Zod schema for:

```text
projectName
repoUrl
liveUrl
description
```

The schema should mirror the Phase 8 backend validation rules as closely as practical.

Client-side validation exists for UX.

Backend validation remains authoritative.

---

### Step 4 — Create Submission Form

Build the form using:

```text
React Hook Form
+
Zod resolver
+
ShadCN Form
```

Suggested component:

```text
StudentSubmissionForm
```

Fields:

```text
Project Name
Repository URL
Live Link
Description
```

Recommended ShadCN components:

```text
Form
FormField
FormItem
FormLabel
FormControl
FormDescription
FormMessage

Input
Textarea
Button
```

---

### Step 5 — Configure React Hook Form

Conceptually:

```ts
useForm<SubmissionFormValues>({
  resolver: zodResolver(submissionSchema),
  defaultValues: {
    projectName: "",
    repoUrl: "",
    liveUrl: "",
    description: "",
  },
});
```

The form values should be inferred from the Zod schema whenever possible.

---

### Step 6 — Create Submission API Layer

Create a frontend API function responsible for:

```http
POST /api/submissions
```

Payload:

```json
{
  "projectName": "...",
  "repoUrl": "...",
  "liveUrl": "...",
  "description": "..."
}
```

Do not send:

```text
studentId
role
status
```

Submission ownership must be determined by the backend authentication context.

---

### Step 7 — Create TanStack Query Mutation

Create a submission mutation using:

```text
useMutation
```

Conceptually:

```ts
const submissionMutation = useMutation({
  mutationFn: createSubmission,
});
```

The mutation must expose appropriate:

```text
pending
success
error
```

states to the UI.

---

### Step 8 — Prevent Duplicate UI Submission

While the mutation is pending:

- Disable the submit button
- Prevent repeated form submission
- Show loading feedback

Example button states:

```text
Submit Project

↓ mutation pending

Submitting...
```

This improves UX but does not replace the Phase 8 backend duplicate protection or rate limiter.

---

### Step 9 — Handle Successful Submission

After receiving a successful response:

```http
201 Created
```

the UI must:

```text
1. Stop displaying the submission form
2. Store/update the submission in TanStack Query cache
3. Display the submitted project
4. Display its status badge
5. Optionally show a success toast
```

Avoid requiring a full page reload.

---

## 7. Existing Submission State

The dashboard must account for students who previously submitted a project.

On page load:

```text
Fetch current student's submission
```

If a submission exists:

```text
Hide submission form
Show submitted project
Show status badge
```

This prevents the form from incorrectly reappearing after:

```text
Page refresh
Logout/login
Navigation away and back
New browser session
```

The dashboard therefore should not rely exclusively on temporary local React state such as:

```ts
const [submitted, setSubmitted] = useState(false);
```

The backend submission state must be the source of truth.

If the backend does not yet provide an endpoint for retrieving the authenticated student's submission, add that API requirement before treating the persisted dashboard state as complete.

---

## 8. Submitted Project View

Create a component such as:

```text
SubmittedProjectCard
```

Display:

```text
Project Name
Repository URL
Live Link
Description
Status
```

Repository and live links should be rendered as links.

For external links, use safe external-link behavior appropriate to the application.

---

## 9. Status Badge

Display the current submission status using a ShadCN:

```text
Badge
```

For example:

```text
PENDING
REVIEWED
APPROVED
REJECTED
```

Only statuses actually defined by the backend/domain model should be implemented.

Do not invent or derive a status on the frontend if the backend already provides it.

Conceptually:

```text
Submission.status
        ↓
StatusBadge
```

---

## 10. Loading State

While loading the existing submission, avoid briefly rendering the form.

Incorrect:

```text
Form appears
↓
request finishes
↓
Form disappears
```

Preferred:

```text
Loading submission...
↓
Server state determined
↓
Render form OR submitted project
```

Use:

```text
Skeleton
```

or another application-standard loading state.

---

## 11. Error Handling

Handle common backend responses.

### 400 — Validation Error

Display useful validation feedback.

```text
400 Bad Request
```

When backend validation maps to specific fields, surface those messages through React Hook Form where practical.

---

### 401 — Unauthorized

Handle using the application's authentication strategy.

Potential action:

```text
Redirect to login
```

---

### 403 — Forbidden

Do not display the student submission workflow to unauthorized roles.

---

### 409 — Duplicate Submission

The server indicates the student already has a submission.

The frontend should recover by synchronizing/refetching the current submission rather than encouraging another submission attempt.

---

### 429 — Rate Limited

Display a clear message such as:

```text
Too many submission attempts. Please try again later.
```

---

### 500 — Server Error

Display a generic error without exposing backend internals.

---

## 12. Suggested Frontend Structure

Adapt this structure to the existing project:

```text
app/
└── student/
    └── dashboard/
        └── page.tsx

components/
└── student/
    ├── submission-form.tsx
    ├── submitted-project-card.tsx
    └── submission-status-badge.tsx

lib/
├── api/
│   └── submissions.ts
├── validations/
│   └── submission.schema.ts
└── query/
    └── query-keys.ts

types/
└── submission.ts
```

Avoid duplicating submission types and schemas unnecessarily.

---

## 13. State Ownership

Use the correct tool for each type of state.

```text
Form state
    → React Hook Form

Validation state
    → Zod + React Hook Form

Mutation state
    → TanStack Query

Submission server state
    → TanStack Query

Authentication
    → Existing authentication architecture
```

Avoid duplicating TanStack Query server state into unnecessary React state.

---

## 14. Testing Plan

Test:

```text
Student with no submission
Student with existing submission
Valid form
Missing project name
Invalid repository URL
Invalid live URL
Missing description
Mutation loading state
Successful submission
Backend 400
Backend 401
Backend 403
Backend 409
Backend 429
Backend 500
Page refresh after submission
```

---

## 15. Completion Checklist

Phase 9 is complete when:

- [ ] `/student/dashboard` exists
- [ ] Route is protected
- [ ] Only students can access the workflow
- [ ] Existing submission is loaded
- [ ] Loading state prevents form flicker
- [ ] Form uses React Hook Form
- [ ] Validation uses Zod
- [ ] UI uses ShadCN Form
- [ ] `projectName` field exists
- [ ] `repoUrl` field exists
- [ ] `liveUrl` field exists
- [ ] `description` field exists
- [ ] Validation messages appear correctly
- [ ] Submission uses TanStack Query mutation
- [ ] Submit button handles pending state
- [ ] Successful submission hides the form
- [ ] Successful submission updates server-state cache
- [ ] Submitted project is displayed
- [ ] Status badge is displayed
- [ ] Existing submission remains visible after refresh
- [ ] `409` duplicate responses are handled
- [ ] `429` rate-limit responses are handled
- [ ] Student can complete the entire workflow through the UI
