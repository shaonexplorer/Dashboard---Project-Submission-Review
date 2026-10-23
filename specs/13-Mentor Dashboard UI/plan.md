# Phase 13 — Mentor Dashboard UI Implementation Plan

## 1. Objective

Build the primary mentor review interface at:

```text
/mentor/dashboard
```

The dashboard will allow mentors to:

- View submission statistics.
- Search project submissions.
- Filter submissions by status.
- Sort submission data.
- Navigate through paginated submissions.
- Access repository and live project links.
- Perform submission review actions.

All pagination, filtering, searching, and sorting must be handled server-side.

---

## 2. Dashboard Structure

The page should contain the following sections:

```text
Mentor Dashboard
│
├── Statistics Cards
│   ├── Total
│   ├── Pending
│   ├── Approved
│   └── Rejected
│
├── Submission Controls
│   ├── Search
│   └── Status Filter
│
├── Submission Table
│
└── Pagination
```

---

## 3. Route

Implement the dashboard at:

```text
/mentor/dashboard
```

The route must only be accessible to authenticated users with the appropriate mentor/admin review permissions established by the application's authentication system.

---

## 4. Statistics Cards

Create four statistics cards:

```text
Total
Pending
Approved
Rejected
```

Each card displays the corresponding submission count returned by the server.

Example data structure:

```ts
type SubmissionStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};
```

The UI should handle loading and unavailable states without breaking the dashboard layout.

---

## 5. Submission Controls

### Search

Provide a search input for finding submissions.

Search must be server-side.

When the search value changes, the resulting query must eventually trigger a new server request rather than filtering the currently loaded rows locally.

Reset the table to page 1 when a new search query is applied.

A small debounce may be used to avoid sending a request for every keystroke.

Example:

```text
Search submissions...
```

### Status Filter

Provide a status filter supporting:

```text
All
Pending
Approved
Rejected
```

Changing the status must:

1. Update the filter state.
2. Reset pagination to page 1.
3. Trigger a new server request.

---

## 6. Submission Table

Use TanStack Table for the table implementation.

Columns:

```text
Student
Project
Repository
Live Link
Status
Submitted At
Actions
```

Recommended row model:

```ts
type Submission = {
  id: string;
  student: {
    id: string;
    name: string;
    email?: string;
  };
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
};
```

Adapt the exact fields to the API response and existing project types.

---

## 7. TanStack Table Configuration

Configure TanStack Table for server-controlled operations.

```ts
const table = useReactTable({
  data,
  columns,
  manualPagination: true,
  manualFiltering: true,
  manualSorting: true,
  // ...
});
```

The client must not perform the primary pagination, filtering, or sorting of submission records.

The table state should include:

```ts
pagination;
sorting;
status;
search;
```

Example pagination state:

```ts
{
  pageIndex: 0,
  pageSize: 10,
}
```

---

## 8. Server Query State

Maintain query state for:

```ts
type DashboardQuery = {
  page: number;
  limit: number;
  search?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
```

The table's zero-based `pageIndex` should be converted to the page numbering expected by the backend API.

Example:

```ts
page = pagination.pageIndex + 1;
```

---

## 9. Data Fetching

Submission data should be requested using the current dashboard state.

Conceptually:

```text
GET /submissions
    ?page=1
    &limit=10
    &search=portfolio
    &status=PENDING
    &sortBy=submittedAt
    &sortOrder=desc
```

The exact endpoint should follow the backend API established by the project.

A new request must occur whenever any server-controlled query parameter changes.

---

## 10. Pagination

Pagination must be server-side.

The API should provide enough metadata for the UI to determine the available pages.

Example:

```ts
type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
```

The dashboard should support:

```text
Previous
Current page information
Next
```

Optionally support direct page navigation if appropriate for the existing design system.

Disable navigation controls when there is no corresponding page.

---

## 11. Sorting

Enable sorting only for columns supported by the backend.

Recommended sortable fields include:

```text
Project
Status
Submitted At
```

When sorting changes:

1. Update TanStack Table sorting state.
2. Convert the sorting state into backend query parameters.
3. Reset to page 1 when appropriate.
4. Send a new server request.

Example:

```ts
[
  {
    id: "submittedAt",
    desc: true,
  },
];
```

can become:

```text
sortBy=submittedAt
sortOrder=desc
```

Do not perform local sorting when `manualSorting` is enabled.

---

## 12. Repository and Live Links

Repository and live-project values should be rendered as clickable links.

External links should open safely in a new tab where appropriate.

Example:

```tsx
<a href={repoUrl} target="_blank" rel="noopener noreferrer">
  Repository
</a>
```

Handle missing or invalid optional live links gracefully according to the project's data rules.

---

## 13. Status Display

Use a consistent status badge for:

```text
Pending
Approved
Rejected
```

The badge should clearly communicate the current review state without relying solely on color.

---

## 14. Actions

The Actions column should expose the review actions supported by the application.

For pending submissions, this may include:

```text
Approve
Reject
```

Actions should operate against the submission ID rather than table position.

After a successful mutation, refresh or invalidate the relevant submission and statistics queries so that the dashboard reflects the latest server state.

Prevent duplicate actions while a mutation is pending.

---

## 15. Loading State

Provide loading feedback while submission data is being requested.

Prefer table skeleton rows or another layout-preserving loading state.

Avoid replacing the entire dashboard unnecessarily when only table data is refreshing.

---

## 16. Empty State

Display an appropriate empty state when the server returns no submissions.

Differentiate where useful between:

```text
No submissions exist.
```

and:

```text
No submissions match the current filters.
```

---

## 17. Error State

Handle failed requests gracefully.

The dashboard should:

- Avoid crashing.
- Display a useful error message.
- Preserve existing controls where practical.
- Allow the user to retry the request.

Mutation failures should also provide feedback and must not leave the UI showing an incorrect final status.

---

## 18. Suggested Component Structure

```text
MentorDashboardPage
│
├── DashboardHeader
│
├── SubmissionStats
│   └── StatCard
│
├── SubmissionToolbar
│   ├── SubmissionSearch
│   └── StatusFilter
│
├── SubmissionTable
│   ├── DataTableHeader
│   ├── DataTableRow
│   ├── StatusBadge
│   └── SubmissionActions
│
└── SubmissionPagination
```

Keep API/query logic separate from reusable presentation components where practical.

---

## 19. Implementation Order

Implement the phase in this order:

1. Create `/mentor/dashboard`.
2. Create dashboard layout.
3. Implement statistics cards.
4. Define submission table columns.
5. Configure TanStack Table.
6. Connect submission API.
7. Implement server-side pagination.
8. Implement server-side status filtering.
9. Implement server-side search.
10. Implement server-side sorting.
11. Implement repository/live links.
12. Implement status badges.
13. Connect review actions.
14. Add loading states.
15. Add empty states.
16. Add error handling.
17. Verify query-state behavior.
18. Test completion criteria.

---

## 20. Completion Criteria

Phase 13 is complete when changing any of the following:

```text
Page
Status
Search
Sort
```

causes a new server request using the corresponding query parameters.

Additionally:

- Statistics are displayed correctly.
- Submission rows come from the server.
- Pagination uses server metadata.
- Filtering is not performed only against currently loaded rows.
- Sorting is server-side.
- Search is server-side.
- Repository and live links are usable.
- Review actions operate on the correct submission.
- Loading, empty, and error states are handled.
- Dashboard access respects the application's authorization rules.
