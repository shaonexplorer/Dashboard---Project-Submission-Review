# Phase 13 — Mentor Dashboard UI Requirements

## 1. Functional Requirements

### FR-01 — Dashboard Route

The application must provide the mentor dashboard at:

```text
/mentor/dashboard
```

The route must respect the project's authentication and authorization rules.

---

### FR-02 — Statistics

The dashboard must display four statistics:

```text
Total
Pending
Approved
Rejected
```

Statistics must represent server-provided submission data.

---

### FR-03 — Submission Table

The dashboard must display submissions using TanStack Table.

Required columns:

| Column       | Requirement                                           |
| ------------ | ----------------------------------------------------- |
| Student      | Display the student associated with the submission    |
| Project      | Display the project name                              |
| Repository   | Provide access to the repository URL                  |
| Live Link    | Provide access to the deployed project when available |
| Status       | Display the current submission status                 |
| Submitted At | Display submission date/time                          |
| Actions      | Display available review actions                      |

---

### FR-04 — Server-Side Pagination

Pagination must be controlled by the server.

TanStack Table must use:

```ts
manualPagination: true;
```

Changing the page must trigger a new server request.

---

### FR-05 — Server-Side Filtering

Filtering must be controlled by the server.

TanStack Table must use:

```ts
manualFiltering: true;
```

Supported status filters must include:

```text
All
Pending
Approved
Rejected
```

Changing the status filter must trigger a new server request.

---

### FR-06 — Server-Side Search

The dashboard must provide a search control.

Search must be executed against the backend rather than only against the currently loaded table rows.

Applying a new search must reset pagination to the first page.

Search changes must result in a new server request.

---

### FR-07 — Server-Side Sorting

Sorting must be controlled by the server.

TanStack Table must use:

```ts
manualSorting: true;
```

Changing a supported column's sorting state must trigger a new server request.

The request must communicate both:

```text
sortBy
sortOrder
```

or their equivalent fields defined by the backend API.

---

### FR-08 — Query Parameters

The frontend must send the current table/query state to the backend.

The request should support the equivalent of:

```text
page
limit
search
status
sortBy
sortOrder
```

Only applicable parameters need to be included.

---

### FR-09 — Pagination Metadata

The server response must provide sufficient metadata for pagination.

The frontend must be able to determine:

```text
Current page
Page size
Total records
Total pages
```

---

### FR-10 — Status Presentation

Submission statuses must support:

```text
PENDING
APPROVED
REJECTED
```

The UI must display them in a clear human-readable form.

---

### FR-11 — External Links

Repository and live-project links must be rendered as appropriate external links.

External links opened in a new tab must use safe link attributes such as:

```text
rel="noopener noreferrer"
```

---

### FR-12 — Review Actions

The Actions column must provide the review actions supported by the project's submission workflow.

Actions must target submissions using stable submission identifiers.

The UI must prevent accidental duplicate requests while an action is already processing.

After a successful review operation, affected dashboard data must be refreshed or invalidated.

---

### FR-13 — Loading State

The dashboard must display an appropriate loading state while data is being fetched.

The layout should remain stable where practical.

---

### FR-14 — Empty State

The table must display an empty state when no submissions are returned.

The UI should distinguish between an empty dataset and no matches caused by active search/filter criteria where practical.

---

### FR-15 — Error State

Failed submission requests must produce a user-visible error state.

The application must not crash because a dashboard request failed.

A retry mechanism should be provided where appropriate.

---

## 2. TanStack Table Requirements

The table configuration must include:

```ts
manualPagination: true,
manualFiltering: true,
manualSorting: true,
```

The application must control relevant table state.

Example:

```ts
const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: 10,
});

const [sorting, setSorting] = useState<SortingState>([]);
```

The backend remains the source of truth for which rows match the active pagination, filtering, search, and sorting state.

---

## 3. Data Requirements

A submission displayed by the dashboard must provide sufficient information for:

```text
Submission ID
Student
Project name
Repository URL
Live URL
Status
Submission timestamp
```

The exact API model may differ as long as all required UI information is available.

---

## 4. UI Requirements

The dashboard must contain:

```text
Statistics Cards
Search
Status Filter
Submission Table
Pagination
```

The interface must remain usable across the screen sizes supported by the existing application.

For smaller screens, the submission table may use horizontal scrolling rather than hiding essential information.

---

## 5. State Requirements

The dashboard must maintain state for:

```text
Pagination
Search
Status
Sorting
```

A change to any server-controlled state must eventually be reflected in the server request.

Search and filter changes must reset the page when retaining the current page could produce invalid or misleading results.

---

## 6. Performance Requirements

Search input should avoid unnecessary request spam.

A debounce may be applied, for example:

```text
300–500 ms
```

Requests should be cached/deduplicated according to the project's existing data-fetching solution where available.

Unrelated component state changes must not intentionally trigger duplicate API requests.

---

## 7. Accessibility Requirements

Interactive controls must be keyboard accessible.

Search controls must have an accessible label or equivalent.

Status filters must expose their purpose to assistive technologies.

Sortable table headers must clearly communicate their interactive behavior.

Action buttons must have understandable labels.

Status information must not depend exclusively on color.

---

## 8. Security Requirements

The mentor dashboard must not rely solely on frontend route protection.

Backend endpoints used by the dashboard must enforce appropriate authentication and authorization.

Submission IDs and other client-provided query values must not be trusted without server-side validation.

Repository and live URLs must be rendered safely.

---

## 9. Completion Requirements

The implementation is considered complete only when each of the following interactions results in server-side data retrieval:

```text
Page change   → Server request
Status change → Server request
Search change → Server request
Sort change   → Server request
```

Client-side-only pagination, search, filtering, or sorting does not satisfy Phase 13 requirements.
