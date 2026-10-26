import { fetcher } from "./fetcher";
import { ApiRequestError } from "./client";

/** Submission lifecycle states, mirroring the Prisma `SubmissionStatus` enum. */
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Fields the student submission table may be sorted by.
 */
export type StudentSubmissionSortField = "createdAt" | "projectName" | "status";

/** Supported sort directions. */
export type SubmissionSortOrder = "asc" | "desc";

/** Number of submissions returned per page when the client does not say. */
export const DEFAULT_SUBMISSION_LIST_LIMIT = 10;

/** Hard ceiling on the page size. */
export const MAX_SUBMISSION_LIST_LIMIT = 100;

/** Longest search term accepted before the query is rejected. */
export const MAX_SUBMISSION_SEARCH_LENGTH = 200;

/**
 * Query parameters for the student's paginated submission list.
 *
 * Mirrors the backend `studentSubmissionListQuerySchema`.
 */
export interface StudentSubmissionListQuery {
  /** 1-based page number. */
  page: number;
  /** Rows per page. */
  limit: number;
  /** Status filter. */
  status?: SubmissionStatus;
  /** Free-text search. */
  search?: string;
  /** Column to sort by. */
  sortBy?: StudentSubmissionSortField;
  /** Sort direction. */
  sortOrder?: SubmissionSortOrder;
}

/**
 * Pagination metadata returned by the server.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * A project from the catalog joined with the student's submission status.
 */
export interface StudentProjectRow {
  /** The catalog project */
  project: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  };
  /** The student's submission for this project, if any */
  submission?: Submission;
  /** Derived state for display */
  state: "available" | "in-review" | "approved" | "rejected" | "draft";
}

/**
 * Response from the paginated submissions endpoint.
 */
export interface PaginatedSubmissionsResponse {
  submissions: StudentProjectRow[];
  pagination: PaginationMeta;
}

/**
 * Machine-readable discriminators the server sends on a conflicting request.
 *
 * The client branches on these instead of on the message, so the wording of
 * an error can change without breaking the UI.
 */
export const SUBMISSION_ERROR_CODES = {
  /** The project is already in review or approved — the student must wait. */
  DUPLICATE_SUBMISSION: "DUPLICATE_SUBMISSION",
  /** The project was rejected — the student has to resubmit, not submit. */
  RESUBMIT_REQUIRED: "RESUBMIT_REQUIRED",
  /** The submission is not in a state that can be resubmitted. */
  NOT_RESUBMITTABLE: "NOT_RESUBMITTABLE",
} as const;

/** The discriminators the API can return. */
export type SubmissionErrorCode =
  (typeof SUBMISSION_ERROR_CODES)[keyof typeof SUBMISSION_ERROR_CODES];

export interface Submission {
  id: string;
  /**
   * The catalog code of the project this submission belongs to ("ph-01").
   *
   * The student picks the project by its code; the display name is written by
   * the server, so the two can never disagree.
   */
  projectId: string;
  /**
   * The project name, snapshotted by the server when the submission was made.
   *
   * It is a copy rather than a live join so the mentor table can search and
   * sort on it without a relation lookup on every row.
   */
  projectName: string;
  repoUrl: string;
  /**
   * Live project URL. Nullable in the contract — a submission is always
   * created with one, but the UI must cope with its absence rather than
   * rendering an invalid link.
   */
  liveUrl: string | null;
  description: string;
  status: SubmissionStatus;
  /** Mentor feedback. `null` until a mentor records a review. */
  feedback: string | null;
  /** Timestamp of the mentor decision. `null` until a review is recorded. */
  reviewedAt: string | null;
  studentId: string;
  /** Which attempt this is — 1 for a first hand-in, 2 after one resubmission. */
  attempt: number;
  /** When this attempt was handed in. `null` on a first attempt. */
  resubmittedAt: string | null;
  /** When the project was handed in. */
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  /** The full project catalog entry with description and active status. */
  project: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  };
}

/** Payload accepted by `POST /api/submissions`. Ownership is decided server-side. */
export interface CreateSubmissionPayload {
  /** The catalog code of the project being submitted. */
  projectId: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
}

/**
 * Payload accepted by `PUT /api/submissions/:id/resubmit`.
 *
 * The project is deliberately absent: a resubmission always stays on the
 * project the submission was made for.
 */
export interface ResubmitSubmissionPayload {
  repoUrl: string;
  liveUrl: string;
  description: string;
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  data?: { submission?: Submission };
}

/**
 * Fetches every submission the authenticated student owns.
 *
 * Uses the paginated endpoint with a large page size to retrieve all results
 * in one request. The list is empty when the student has not submitted anything
 * yet — that is a normal state, not a failure.
 */
export async function getMySubmissionsApi(): Promise<Submission[]> {
  // Use the paginated endpoint with max limit to get all submissions
  const response = await fetcher<{
    success: boolean;
    message: string;
    data?: (Submission & { project: Submission["project"] })[];
    pagination?: PaginationMeta;
  }>("/submissions/me?limit=100");

  return response.data ?? [];
}

/**
 * Creates a project submission for the authenticated student.
 *
 * The student identity is taken from the server-side auth context — the
 * payload deliberately carries no `studentId`, `role` or `status`.
 */
export async function createSubmissionApi(
  payload: CreateSubmissionPayload
): Promise<Submission> {
  const response = await fetcher<SubmissionResponse>("/submissions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.data?.submission) {
    throw new ApiRequestError(500, "The server did not return the created submission.");
  }

  return response.data.submission;
}

/**
 * Replaces the deliverable of a rejected submission.
 *
 * The server reuses the existing row: the attempt counter goes up, the row
 * returns to PENDING and the previous review is kept so the student can still
 * read what the mentor asked for.
 */
export async function resubmitSubmissionApi(
  submissionId: string,
  payload: ResubmitSubmissionPayload
): Promise<Submission> {
  const response = await fetcher<SubmissionResponse>(
    `/submissions/${submissionId}/resubmit`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  if (!response.data?.submission) {
    throw new ApiRequestError(500, "The server did not return the resubmitted submission.");
  }

  return response.data.submission;
}

/**
 * Builds URLSearchParams from the query object.
 *
 * Only applicable parameters are sent; empty search and absent status
 * are omitted entirely so the server applies no restriction.
 */
function buildStudentSubmissionListSearchParams(
  query: StudentSubmissionListQuery,
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
 * Derives the display state from a submission.
 */
function deriveSubmissionState(submission: Submission): StudentProjectRow["state"] {
  if (submission.status === "APPROVED") {
    return "approved";
  }
  if (submission.status === "REJECTED") {
    return "rejected";
  }
  if (submission.status === "PENDING") {
    return "in-review";
  }
  return "draft";
}

/**
 * Transforms a flat submission-with-project object from the API into the
 * StudentProjectRow format expected by the UI.
 */
function transformToStudentProjectRow(item: Submission & { project: Submission["project"] }): StudentProjectRow {
  return {
    project: item.project,
    submission: item,
    state: deriveSubmissionState(item),
  };
}

/**
 * Student submission statistics returned by the server.
 */
export interface StudentSubmissionStats {
  total: number;
  pending: number;
  active: number;
  approved: number;
  rejected: number;
  archived: number;
}

/**
 * Fetches aggregate submission counts for the authenticated student.
 */
export async function getMySubmissionStatsApi(): Promise<StudentSubmissionStats> {
  const response = await fetcher<{
    success: boolean;
    message: string;
    data?: StudentSubmissionStats;
  }>("/submissions/me/stats");

  return response.data ?? {
    total: 0,
    pending: 0,
    active: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
  };
}

/**
 * Fetches a paginated list of projects with the student's submission status.
 *
 * Server-side pagination, filtering, searching and sorting. Returns the
 * current page of results plus pagination metadata.
 */
export async function getMySubmissionsPaginatedApi(
  query: StudentSubmissionListQuery,
): Promise<PaginatedSubmissionsResponse> {
  const params = buildStudentSubmissionListSearchParams(query);
  const response = await fetcher<{
    success: boolean;
    message: string;
    data?: (Submission & { project: Submission["project"] })[];
    pagination?: PaginationMeta;
  }>(`/submissions/me?${params.toString()}`);

  const submissions = response.data ?? [];
  const pagination = response.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  return {
    submissions: submissions.map(transformToStudentProjectRow),
    pagination,
  };
}
