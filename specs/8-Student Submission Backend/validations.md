# Phase 8 — Student Submission Validation Specification

## 1. Purpose

This document defines validation rules for:

```http
POST /api/submissions
```

Validation must occur before submission creation.

Expected payload:

```json
{
  "projectName": "Project Review Dashboard",
  "repoUrl": "https://github.com/student/project",
  "liveUrl": "https://project.example.com",
  "description": "A dashboard for submitting and reviewing projects."
}
```

---

## 2. Validation Summary

| Field         | Required | Type   | Main Validation      |
| ------------- | -------- | ------ | -------------------- |
| `projectName` | Yes      | String | Non-empty            |
| `repoUrl`     | Yes      | String | Valid HTTP/HTTPS URL |
| `liveUrl`     | Yes      | String | Valid HTTP/HTTPS URL |
| `description` | Yes      | String | Non-empty            |

The implementation may add reasonable length constraints consistent with the database schema and the rest of the application.

---

## 3. `projectName`

### Requirements

`projectName` must:

- Be present
- Be a string
- Be trimmed
- Not be empty after trimming

Example valid values:

```text
Project Review Dashboard
Student Management System
AI Study Assistant
```

Invalid values:

```json
""
```

```json
"   "
```

```json
null
```

```json
123
```

### Recommended Rule

Conceptually:

```ts
string().trim().min(1);
```

A reasonable maximum length may also be enforced, for example:

```text
100–150 characters
```

provided it matches the database schema and project conventions.

---

## 4. `repoUrl`

### Requirements

`repoUrl` must:

- Be present
- Be a string
- Be trimmed
- Be a syntactically valid URL
- Use `http` or `https`

Valid:

```text
https://github.com/student/project
```

Invalid:

```text
github.com/student/project
```

```text
student/project
```

```text
not-a-url
```

```text
ftp://example.com/project
```

### GitHub-Specific Validation

If submissions are required to use GitHub repositories, validation should additionally ensure the URL points to the approved GitHub hostname.

Conceptually:

```text
protocol = https/http
hostname = github.com
```

Do not rely only on checks such as:

```ts
repoUrl.includes("github.com");
```

because malformed or deceptive URLs could pass simple substring validation.

Prefer parsing the URL and validating its protocol and hostname.

---

## 5. `liveUrl`

### Requirements

`liveUrl` must:

- Be present
- Be a string
- Be trimmed
- Be a syntactically valid URL
- Use `http` or `https`

Valid examples:

```text
https://my-project.vercel.app
https://project.example.com
http://example.com
```

Invalid examples:

```text
my-project.vercel.app
```

```text
not-a-url
```

```text
ftp://example.com
```

```text
javascript:alert(1)
```

### Recommended Validation

Parse the URL and explicitly allow:

```text
http:
https:
```

rather than accepting arbitrary URL schemes.

---

## 6. `description`

### Requirements

`description` must:

- Be present
- Be a string
- Be trimmed
- Contain content after trimming

Invalid:

```json
""
```

```json
"     "
```

```json
null
```

### Recommended Rule

Conceptually:

```ts
string().trim().min(1);
```

A reasonable maximum should be configured if the database column or project requirements impose one.

---

## 7. Unknown Fields

The validation strategy should follow the application's existing convention for unknown request properties.

If strict validation is used, unexpected fields may be rejected.

For example:

```json
{
  "projectName": "Example",
  "repoUrl": "https://github.com/user/example",
  "liveUrl": "https://example.com",
  "description": "Example project",
  "studentId": "another-user-id"
}
```

Regardless of whether unknown properties are stripped or rejected, `studentId` from the request body must never determine submission ownership.

Submission ownership must come from:

```ts
req.user.id;
```

or the equivalent trusted authentication context.

---

## 8. Duplicate Validation

Duplicate detection is a business validation rather than request-body validation.

Query using the authenticated student's ID:

```ts
const existingSubmission = await prisma.submission.findUnique({
  where: {
    studentId,
  },
});
```

When a submission exists:

```http
409 Conflict
```

Suggested response:

```json
{
  "success": false,
  "message": "You have already submitted a project"
}
```

---

## 9. Database-Level Validation

Prisma must independently enforce:

```prisma
studentId String @unique
```

This ensures duplicate submissions cannot be inserted even when concurrent requests both pass the application-level duplicate check.

The unique-constraint error must be mapped to:

```http
409 Conflict
```

instead of returning an uncontrolled internal error.

---

## 10. Authorization Validation

Before submission creation:

```text
Authenticated?
      │
      ├── No → 401
      │
      └── Yes
            │
            ▼
      Role === STUDENT?
            │
            ├── No → 403
            │
            └── Yes → continue
```

A mentor must never be able to submit through direct API access even if the frontend hides the submission interface.

---

## 11. Rate-Limit Validation

Apply the dedicated submission limiter to:

```http
POST /api/submissions
```

Target:

```text
5 requests / 10 minutes / IP
```

Expected behavior:

```text
Requests 1–5 → processed normally
Request 6+   → 429 Too Many Requests
```

Requests rejected for other reasons may still count toward the rate limit depending on the selected limiter configuration. The implementation and tests should use one consistent policy.

---

## 12. Validation Test Matrix

| Test                        | Input/Condition                     | Expected      |
| --------------------------- | ----------------------------------- | ------------- |
| Valid submission            | All valid fields                    | `201`         |
| Missing project name        | No `projectName`                    | `400`         |
| Empty project name          | `"   "`                             | `400`         |
| Missing repository          | No `repoUrl`                        | `400`         |
| Invalid repository URL      | `"github"`                          | `400`         |
| Invalid repository protocol | `ftp://...`                         | `400`         |
| Missing live URL            | No `liveUrl`                        | `400`         |
| Invalid live URL            | `"website"`                         | `400`         |
| Unsafe URL protocol         | `javascript:...`                    | `400`         |
| Missing description         | No `description`                    | `400`         |
| Empty description           | `"   "`                             | `400`         |
| Unauthenticated user        | No valid authentication             | `401`         |
| Mentor request              | Role = `MENTOR`                     | `403`         |
| Existing submission         | Same `studentId`                    | `409`         |
| Concurrent duplicate        | Same student, simultaneous requests | `201` + `409` |
| Rate limit exceeded         | More than 5 requests/10 min/IP      | `429`         |

---

## 13. Validation Order

A recommended processing sequence is:

```text
1. Rate-limit request
        ↓
2. Authenticate user
        ↓
3. Verify STUDENT role
        ↓
4. Validate request body
        ↓
5. Obtain studentId from authenticated context
        ↓
6. Check existing submission
        ↓
7. Create submission
        ↓
8. Handle database uniqueness race
        ↓
9. Return 201 Created
```

The exact middleware ordering can follow existing application conventions, but no submission may be created without passing authentication, authorization, payload validation, duplicate protection, and database constraints.

---

## 14. Final Validation Checklist

Before Phase 8 is considered complete:

- [ ] `projectName` is required
- [ ] `projectName` cannot be blank
- [ ] `repoUrl` is required
- [ ] `repoUrl` must be a valid HTTP/HTTPS URL
- [ ] GitHub hostname is enforced if required by project rules
- [ ] `liveUrl` is required
- [ ] `liveUrl` must be a valid HTTP/HTTPS URL
- [ ] `description` is required
- [ ] `description` cannot be blank
- [ ] Client-provided `studentId` is never trusted
- [ ] User must be authenticated
- [ ] User must have the `STUDENT` role
- [ ] Existing submission produces `409`
- [ ] `studentId` is unique at the database level
- [ ] Concurrent duplicates produce `409`
- [ ] Submission-specific rate limiter is enabled
- [ ] More than 5 requests within 10 minutes per IP produce `429`
- [ ] Validation failures produce consistent API error responses
