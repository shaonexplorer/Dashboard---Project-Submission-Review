import { fetcher } from "./fetcher";
import type { Submission, SubmissionStatus } from "./submissions";

/**
 * A submission row as the mentor list returns it.
 *
 * The student-facing contract (`Submission`) is extended with the student
 * identity the mentor table renders. Everything else — status, links,
 * timestamps — is identical, so the two views can never disagree about what a
 * submission is.
 *
 * `resubmittedAt` is the one field the mentor list does not carry: the
 * list grew `projectId` and `attempt`, and nothing else, so that every
 * other field of the response stays exactly as it was.
 */
export interface MentorSubmission extends Omit<Submission, "resubmittedAt"> {
  student: {
    id: string;
    fullName: string;
    email: string;
  };
}

/**
 * Pagination metadata returned by the server.
 *
 * The counts describe the whole filtered data set, not the rows currently on
 * screen, which is what lets the pager show "page 2 of 5" without knowing how
 * many submissions exist in total.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * The aggregate counts rendered by the statistics cards.
 *
 * Mirrors the backend `SubmissionStats` shape.
 */
export interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

/**
 * Fields the backend is able to sort by.
 *
 * The list is an explicit whitelist — the client never sends a field name the
 * server has not agreed to sort on.
 */
export type SubmissionSortField = "createdAt" | "projectName" | "status";

/** Supported sort directions. */
export type SubmissionSortOrder = "asc" | "desc";

/**
 * The query the mentor table sends to the server.
 *
 * Every table operation is expressed here; the client never filters, sorts or
 * paginates the rows it already has.
 */
export interface SubmissionListQuery {
  /** 1-based page number. */
  page: number;
  /** Rows per page. */
  limit: number;
  /** Free-text search, matched against project name, student name and email. */
  search?: string;
  /** Restricts the result to a single status. */
  status?: SubmissionStatus;
  /** Column the results are ordered by. */
  sortBy?: SubmissionSortField;
  /** Direction the results are ordered in. */
  sortOrder?: SubmissionSortOrder;
}

/** Review decisions a mentor can record. */
export type ReviewDecision = Extract<SubmissionStatus, "APPROVED" | "REJECTED">;

/** Payload for a review decision. */
export interface ReviewSubmissionPayload {
  status: ReviewDecision;
  /** Optional notes for the student. */
  feedback?: string;
}

interface PaginatedResponse {
  success: boolean;
  message: string;
  data?: MentorSubmission[];
  pagination?: PaginationMeta;
}

interface StatsResponse {
  success: boolean;
  message: string;
  data?: SubmissionStats;
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  data?: { submission?: MentorSubmission };
}

/**
 * Serialises the table state into the query string the API expects.
 *
 * Only applicable parameters are sent: an empty search and an absent status
 * filter are left out entirely rather than sent as empty values, so the
 * server applies no restriction at all.
 */
export function buildSubmissionListSearchParams(
  query: SubmissionListQuery,
): URLSearchParams {
  const params = new URLSearchParams();

  params.set("page", String(query.page));
  params.set("limit", String(query.limit));

  const search = query.search?.trim();
  if (search) {
    params.set("search", search);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.sortBy) {
    params.set("sortBy", query.sortBy);
  }

  if (query.sortOrder) {
    params.set("sortOrder", query.sortOrder);
  }

  return params;
}

/**
 * Fetches one page of submissions for the mentor table.
 *
 * Pagination, filtering, searching and sorting are all performed by the
 * server; the response carries the rows for the requested page together with
 * the pagination metadata that describes the whole data set.
 */
export async function getSubmissionsApi(query: SubmissionListQuery): Promise<{
  submissions: MentorSubmission[];
  pagination: PaginationMeta;
}> {
  const params = buildSubmissionListSearchParams(query);
  const response = await fetcher<PaginatedResponse>(
    `/submissions?${params.toString()}`,
  );

  return {
    submissions: response.data ?? [],
    pagination: response.pagination ?? {
      page: query.page,
      limit: query.limit,
      total: 0,
      totalPages: 0,
    },
  };
}

/**
 * Fetches the aggregate submission counts for the statistics cards.
 *
 * The counts describe the whole table and are never derived from the rows
 * currently loaded in the table.
 */
export async function getSubmissionStatsApi(): Promise<SubmissionStats> {
  const response = await fetcher<StatsResponse>("/submissions/stats");

  return (
    response.data ?? {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    }
  );
}

/**
 * Records a review decision on a submission.
 *
 * The submission id identifies the row to update — the decision never refers
 * to a table position, so a row that moved between requests cannot be
 * reviewed by mistake.
 */
export async function updateSubmissionStatusApi(
  submissionId: string,
  payload: ReviewSubmissionPayload,
): Promise<MentorSubmission> {
  const response = await fetcher<SubmissionResponse>(
    `/submissions/${submissionId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

  if (!response.data?.submission) {
    throw new Error("The server did not return the updated submission.");
  }

  return response.data.submission;
}
