# Phase 13 — Mentor Dashboard UI Validation Specification

## 1. Purpose

This document defines the validation rules and verification scenarios for the Mentor Dashboard.

The primary requirement is to verify that:

```text
Pagination
Status filtering
Search
Sorting
```

are server-controlled rather than operating only on the currently loaded table data.

---

## 2. Route Validation

### VAL-01 — Authorized Access

**Given**

An authenticated user with the required mentor/reviewer permission.

**When**

The user navigates to:

```text
/mentor/dashboard
```

**Then**

The mentor dashboard must render successfully.

---

### VAL-02 — Unauthorized Access

**Given**

A user without the required permission.

**When**

The user attempts to access:

```text
/mentor/dashboard
```

**Then**

Access must be denied according to the application's authentication/authorization strategy.

Frontend protection must not replace backend authorization.

---

## 3. Statistics Validation

### VAL-03 — Statistics Rendering

Verify that the dashboard contains:

```text
Total
Pending
Approved
Rejected
```

Each value must correspond to the server response.

---

### VAL-04 — Statistics Consistency

Validate logically:

```text
total >= 0
pending >= 0
approved >= 0
rejected >= 0
```

When the application's status model contains only these three statuses, verify:

```text
total === pending + approved + rejected
```

Do not enforce this equality if additional statuses exist in the backend domain model.

---

## 4. Pagination Validation

### VAL-05 — Page Change Request

**Given**

The user is viewing page 1.

**When**

The user selects page 2.

**Then**

A new server request must occur.

Example:

```text
?page=2&limit=10
```

The table must render the records returned for page 2.

---

### VAL-06 — Previous Page

When the current page is greater than the first page, selecting Previous must request the previous server page.

---

### VAL-07 — Pagination Boundaries

Previous must be disabled on the first page.

Next must be disabled on the final page.

The UI must not request invalid pages through normal pagination controls.

---

### VAL-08 — Pagination Metadata

The pagination UI must derive its boundaries from server-provided pagination information rather than assuming that the currently loaded row count represents the entire dataset.

---

## 5. Status Filter Validation

### VAL-09 — Pending Filter

Selecting:

```text
Pending
```

must result in a server request containing the equivalent of:

```text
status=PENDING
```

Returned rows must represent the server response.

---

### VAL-10 — Approved Filter

Selecting:

```text
Approved
```

must request the equivalent of:

```text
status=APPROVED
```

---

### VAL-11 — Rejected Filter

Selecting:

```text
Rejected
```

must request the equivalent of:

```text
status=REJECTED
```

---

### VAL-12 — All Filter

Selecting:

```text
All
```

must remove the status restriction from the server query or use the backend's defined equivalent.

The client must not simply restore previously cached rows as though they represent the complete dataset.

---

### VAL-13 — Filter Resets Pagination

**Given**

The user is currently on page 4.

**When**

The status changes.

**Then**

Pagination must reset to:

```text
page = 1
```

and a new server request must occur.

---

## 6. Search Validation

### VAL-14 — Search Request

Entering a search value such as:

```text
portfolio
```

must eventually trigger a server request containing the equivalent of:

```text
search=portfolio
```

---

### VAL-15 — Search Must Be Server-Side

The search implementation must not only filter:

```ts
currentPageRows;
```

on the client.

A search must be capable of returning matching submissions that were not present in the previously loaded page.

---

### VAL-16 — Search Pagination Reset

When a new search is applied:

```text
page = 1
```

must be requested.

---

### VAL-17 — Empty Search

Clearing the search input must remove the search condition from the request and retrieve the appropriate unsearched dataset.

---

### VAL-18 — Search Whitespace

Leading and trailing whitespace should not produce unintended search behavior.

For example:

```text
"  portfolio  "
```

should normally be normalized to:

```text
"portfolio"
```

before being used as a query value.

---

### VAL-19 — Search Debounce

If debounce is implemented, rapid typing must not create unnecessary requests for every intermediate keystroke.

Example input:

```text
p
pr
pro
proj
project
```

should result in the final settled query being requested after the configured debounce interval rather than intentionally issuing all five requests.

---

## 7. Sorting Validation

### VAL-20 — Ascending Sort

Selecting ascending sorting on a supported column must send:

```text
sortBy=<field>
sortOrder=asc
```

or the backend's equivalent.

---

### VAL-21 — Descending Sort

Selecting descending sorting must send:

```text
sortBy=<field>
sortOrder=desc
```

---

### VAL-22 — Server-Side Sorting

The client must not sort only the currently loaded page when:

```ts
manualSorting: true;
```

The table must display the order returned by the backend.

---

### VAL-23 — Unsupported Sorting

Columns that are not supported by the backend should not expose misleading sorting controls.

The frontend must not send arbitrary field names as sortable database fields.

---

## 8. Combined Query Validation

The dashboard must correctly combine query state.

Example:

```text
page=2
limit=10
search=dashboard
status=PENDING
sortBy=submittedAt
sortOrder=desc
```

The resulting table must represent the server response for the complete combination.

---

### VAL-24 — Search + Status

Applying:

```text
search=dashboard
status=APPROVED
```

must return approved submissions matching the server-side search.

---

### VAL-25 — Status + Sorting

Applying:

```text
status=PENDING
sortBy=submittedAt
sortOrder=desc
```

must return pending submissions in the server-provided descending order.

---

### VAL-26 — Search + Status + Sort + Pagination

All four controls must work together without one state unexpectedly removing another.

Changing only the page must preserve:

```text
search
status
sortBy
sortOrder
```

unless explicitly reset by application rules.

---

## 9. Table Data Validation

Each rendered row must correctly map:

```text
Student
Project
Repository
Live Link
Status
Submitted At
Actions
```

to the corresponding server record.

Rows must use a stable unique submission identifier.

---

## 10. URL Validation

Repository links must contain a valid value supplied by the trusted API representation.

Live links must follow the application's submission validation rules.

When links open in a new tab, verify:

```tsx
target = "_blank";
rel = "noopener noreferrer";
```

The UI must not construct executable HTML from URL values.

---

## 11. Status Validation

Only supported submission statuses should be rendered as normal review states:

```text
PENDING
APPROVED
REJECTED
```

Unexpected status values must not crash the table.

They should be handled with a safe fallback or according to the application's domain model.

---

## 12. Review Action Validation

### VAL-27 — Correct Submission

Approve and Reject operations must use the selected submission's stable ID.

---

### VAL-28 — Pending Action

While an action request is processing:

```text
Approve
Reject
```

controls for that operation should be disabled or otherwise protected against duplicate submissions.

---

### VAL-29 — Successful Review

After a successful review:

1. The affected submission state must be refreshed.
2. Relevant statistics must be refreshed.
3. The displayed status must match the server state.

---

### VAL-30 — Failed Review

If an Approve or Reject request fails:

- The UI must communicate failure.
- The submission must not remain falsely displayed as successfully updated.
- The user must be able to retry when appropriate.

---

## 13. Loading Validation

While fetching data:

- Loading feedback must be visible.
- Existing layout should remain stable where practical.
- The user must not mistake stale data for newly loaded results.

---

## 14. Empty-State Validation

### No Submissions

When:

```text
total = 0
```

display an appropriate empty state.

### No Matching Results

When submissions exist but the active query returns zero rows, display an appropriate no-results state.

Example:

```text
No submissions match your current search or filters.
```

---

## 15. Error Validation

Simulate a failed submission-list request.

Verify:

- Dashboard does not crash.
- Error feedback appears.
- Invalid/partial response data is not rendered as valid submission data.
- Retry is available where appropriate.

---

## 16. Request Validation

Before sending query state, normalize client values where appropriate.

Conceptual rules:

```ts
page >= 1
limit > 0
search = search.trim()
status ∈ { PENDING, APPROVED, REJECTED }
sortOrder ∈ { asc, desc }
sortBy ∈ allowedSortableFields
```

The backend must independently validate these values. Client-side validation is not a security boundary.

---

## 17. Manual TanStack Configuration Check

Verify that the table uses:

```ts
manualPagination: true,
manualFiltering: true,
manualSorting: true,
```

Ensure client-side row models are not accidentally being used to replace the required server-side behavior.

---

## 18. Network Verification

During manual testing, inspect network requests.

Perform these actions independently:

```text
Change page
Change status
Enter search
Change sorting
```

For every action, confirm:

```text
UI interaction
      ↓
Query state changes
      ↓
New server request
      ↓
Server returns data
      ↓
Table renders returned rows
```

The implementation fails the Phase 13 completion criteria if any required operation changes table results exclusively on the client.

---

## 19. Final Validation Checklist

- [ ] `/mentor/dashboard` renders for authorized users.
- [ ] Unauthorized access is prevented.
- [ ] Total statistic is displayed.
- [ ] Pending statistic is displayed.
- [ ] Approved statistic is displayed.
- [ ] Rejected statistic is displayed.
- [ ] TanStack Table is used.
- [ ] All required columns are present.
- [ ] `manualPagination` is enabled.
- [ ] `manualFiltering` is enabled.
- [ ] `manualSorting` is enabled.
- [ ] Page changes trigger server requests.
- [ ] Status changes trigger server requests.
- [ ] Search changes trigger server requests.
- [ ] Sort changes trigger server requests.
- [ ] Search/filter changes reset pagination appropriately.
- [ ] Combined query states work correctly.
- [ ] Pagination uses server metadata.
- [ ] Repository links work.
- [ ] Live links work when available.
- [ ] Statuses are displayed correctly.
- [ ] Review actions target the correct submission.
- [ ] Successful mutations refresh affected data.
- [ ] Failed mutations are handled safely.
- [ ] Loading state works.
- [ ] Empty state works.
- [ ] Error state works.
- [ ] Backend remains responsible for authorization and query validation.

## 20. Definition of Done

Phase 13 is validated when the mentor can interact with:

```text
Page
Status
Search
Sort
```

and every interaction produces the appropriate server request and renders the server-returned result.

No required pagination, filtering, searching, or sorting behavior may depend exclusively on the currently loaded client-side rows.
