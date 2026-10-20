# Phase 9 — Student Submission Frontend Validation Specification

## 1. Purpose

Define frontend validation behavior for the student submission form at:

```text
/student/dashboard
```

The validation system must use:

```text
Zod
+
React Hook Form
+
ShadCN Form
```

Frontend validation improves UX but does not replace backend validation.

---

## 2. Form Schema

The form contains:

```ts
{
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
}
```

The frontend schema should align with Phase 8 backend validation.

---

## 3. `projectName`

### Rules

The field must:

- Be present
- Be a string
- Be trimmed
- Not be empty after trimming

Invalid:

```text
""
"    "
```

Recommended conceptual Zod rule:

```ts
z.string().trim().min(1, "Project name is required");
```

A maximum length may be added if the Phase 8 backend uses one.

Example:

```ts
.max(150, "Project name must be 150 characters or less")
```

Frontend and backend limits must remain consistent.

---

## 4. `repoUrl`

### Rules

The field must:

- Be present
- Be a string
- Be a valid URL
- Use HTTP or HTTPS
- Match backend repository requirements

Valid example:

```text
https://github.com/student/project
```

Invalid examples:

```text
github.com/student/project
not-a-url
student/project
ftp://github.com/student/project
```

Do not use only:

```ts
value.includes("github.com");
```

for GitHub validation.

Parse and validate the URL instead.

Conceptually:

```ts
const url = new URL(value);

return (
  ["http:", "https:"].includes(url.protocol) && url.hostname === "github.com"
);
```

Only enforce the GitHub hostname when Phase 8/backend requirements require GitHub specifically.

Suggested validation message:

```text
Enter a valid repository URL
```

Or, when GitHub is mandatory:

```text
Enter a valid GitHub repository URL
```

---

## 5. `liveUrl`

### Rules

The field must:

- Be present
- Be a string
- Be a valid URL
- Use HTTP or HTTPS

Valid:

```text
https://project.vercel.app
https://project.example.com
http://example.com
```

Invalid:

```text
project.vercel.app
not-a-url
ftp://example.com
javascript:alert(1)
```

Recommended conceptual validation:

```ts
const url = new URL(value);

return ["http:", "https:"].includes(url.protocol);
```

Suggested error:

```text
Enter a valid live project URL
```

---

## 6. `description`

### Rules

The field must:

- Be present
- Be a string
- Be trimmed
- Not be empty after trimming

Invalid:

```text
""
"       "
```

Conceptually:

```ts
z.string().trim().min(1, "Description is required");
```

A maximum length should only be introduced when compatible with the backend contract.

---

## 7. Recommended Schema Shape

A conceptual schema:

```ts
const submissionSchema = z.object({
  projectName: z.string().trim().min(1, "Project name is required"),

  repoUrl: z.string().trim().min(1, "Repository URL is required"),

  liveUrl: z.string().trim().min(1, "Live link is required"),

  description: z.string().trim().min(1, "Description is required"),
});
```

URL protocol and hostname validation should then be added so the schema exactly matches the Phase 8 backend rules.

Do not maintain intentionally different frontend and backend validation contracts.

---

## 8. Field Error Display

Use ShadCN:

```text
FormMessage
```

to display field-level validation errors.

Example:

```text
Repository URL
┌──────────────────────────────┐
│ github                       │
└──────────────────────────────┘
Enter a valid repository URL
```

Validation errors should be specific enough for the student to correct the input.

---

## 9. Submit Behavior

When the student clicks:

```text
Submit Project
```

React Hook Form must run the Zod resolver first.

Flow:

```text
Submit
  ↓
Zod validation
  │
  ├── Invalid
  │      ↓
  │   Show errors
  │   Do NOT call API
  │
  └── Valid
         ↓
     Mutation
         ↓
POST /api/submissions
```

Invalid client-side forms must not trigger the submission mutation.

---

## 10. Mutation Validation

While:

```ts
mutation.isPending === true;
```

the submit action must be disabled.

Conceptually:

```text
Normal:

[ Submit Project ]

Pending:

[ Submitting... ]
```

This prevents accidental repeated requests.

Backend duplicate protection and rate limiting must still remain enabled.

---

## 11. Server Validation Errors

Client validation does not guarantee server acceptance.

The frontend must handle backend:

```http
400 Bad Request
```

If the server provides structured field errors, map them back to React Hook Form where practical.

Conceptually:

```ts
form.setError("repoUrl", {
  type: "server",
  message: serverMessage,
});
```

Do not replace useful backend validation messages with misleading generic errors.

---

## 12. Duplicate Submission

When:

```http
409 Conflict
```

is returned, the frontend should assume server state may already contain a submission.

Recommended flow:

```text
409
 ↓
Invalidate/refetch current submission query
 ↓
Submission found
 ↓
Hide form
 ↓
Show submitted project
```

This is more robust than simply displaying:

```text
Submission failed
```

because `409` specifically indicates that another submission already exists.

---

## 13. Rate-Limit Validation

When the API returns:

```http
429 Too Many Requests
```

display an understandable message.

Example:

```text
Too many submission attempts. Please try again later.
```

Do not automatically retry project-creation mutations when the server responds with `429`.

---

## 14. Authentication Errors

### 401

```text
Authentication missing/expired
```

Use the application's authentication recovery flow.

### 403

```text
Authenticated user lacks STUDENT permission
```

The submission form must not remain usable.

---

## 15. Submission Success Validation

Only treat the submission as successfully created after receiving a successful backend response.

Do not hide the form immediately before the mutation completes.

Correct:

```text
Submit
 ↓
Pending
 ↓
201 Created
 ↓
Update cache
 ↓
Hide form
 ↓
Show submitted project
```

Incorrect:

```text
Submit
 ↓
Immediately hide form
 ↓
API request fails
```

unless an intentional optimistic-update strategy with rollback has been explicitly designed.

For this workflow, waiting for confirmed creation is simpler and safer.

---

## 16. Existing Submission Validation

When `/student/dashboard` loads:

```text
Submission query pending?
        │
        ├── Yes
        │     ↓
        │   Loading UI
        │
        └── No
              │
              ├── Submission exists
              │       ↓
              │   Project view
              │
              └── No submission
                      ↓
                    Form
```

Never determine this only from temporary local state.

---

## 17. Validation Test Matrix

| Scenario                            | Expected Result             |
| ----------------------------------- | --------------------------- |
| Empty `projectName`                 | Field error                 |
| Whitespace-only `projectName`       | Field error                 |
| Empty `repoUrl`                     | Field error                 |
| Malformed `repoUrl`                 | Field error                 |
| Invalid repository protocol         | Field error                 |
| Non-GitHub URL when GitHub required | Field error                 |
| Empty `liveUrl`                     | Field error                 |
| Malformed `liveUrl`                 | Field error                 |
| Unsafe live-link protocol           | Field error                 |
| Empty `description`                 | Field error                 |
| Whitespace-only description         | Field error                 |
| All fields valid                    | Mutation executes           |
| Mutation pending                    | Submit disabled             |
| `400` response                      | Validation/error feedback   |
| `401` response                      | Authentication flow         |
| `403` response                      | Submission UI unavailable   |
| `409` response                      | Refetch existing submission |
| `429` response                      | Rate-limit message          |
| `500` response                      | Generic server error        |
| `201` response                      | Form replaced by project    |
| Refresh after submission            | Existing project shown      |

---

## 18. Frontend/Backend Validation Relationship

Validation should exist at both layers:

```text
Frontend validation
        ↓
Fast UX feedback
        ↓
POST /api/submissions
        ↓
Backend validation
        ↓
Security + authoritative validation
        ↓
Database constraints
```

Therefore:

```text
Frontend Zod
≠
Security boundary
```

A user can bypass browser validation and directly call the API.

Phase 8 backend validation must remain authoritative.

---

## 19. Final Validation Checklist

- [ ] React Hook Form manages the form
- [ ] Zod schema validates fields
- [ ] ShadCN Form displays errors
- [ ] `projectName` is required
- [ ] Blank project names fail
- [ ] `repoUrl` is required
- [ ] Repository URL syntax is validated
- [ ] Repository URL protocol is validated
- [ ] GitHub hostname is validated when required
- [ ] `liveUrl` is required
- [ ] Live URL syntax is validated
- [ ] Live URL protocol is HTTP/HTTPS
- [ ] `description` is required
- [ ] Blank descriptions fail
- [ ] Invalid forms do not call the API
- [ ] Valid forms trigger the TanStack mutation
- [ ] Submit button is disabled while pending
- [ ] `400` errors are handled
- [ ] `401` errors are handled
- [ ] `403` errors are handled
- [ ] `409` triggers submission-state synchronization
- [ ] `429` displays appropriate feedback
- [ ] `500` displays generic error feedback
- [ ] Successful submission hides the form
- [ ] Successful submission displays project information
- [ ] Submission status badge is displayed
- [ ] Refresh does not restore the form for an already-submitted student
