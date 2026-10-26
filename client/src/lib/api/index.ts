/**
 * Unified API client for both Server and Client Components.
 *
 * This module provides a single fetcher that works in both contexts:
 * - Server Components: Automatically forwards cookies from the incoming request
 * - Client Components: Uses credentials: "include" for automatic cookie handling
 */
export { unifiedFetch, fetcher } from "./unified-fetcher";

/** Error types for API responses */
export { ApiRequestError, type ApiFieldError } from "./client";

/** Authentication API */
export * from "./auth";

/** Project catalog API */
export * from "./projects";

/** Submission API (student-facing) */
export {
  type SubmissionStatus,
  type StudentSubmissionSortField,
  type StudentSubmissionListQuery,
  type PaginationMeta,
  type StudentProjectRow,
  type PaginatedSubmissionsResponse,
  type SubmissionErrorCode,
  type Submission,
  type CreateSubmissionPayload,
  type ResubmitSubmissionPayload,
  type StudentSubmissionStats,
  SUBMISSION_ERROR_CODES,
  getMySubmissionsApi,
  createSubmissionApi,
  resubmitSubmissionApi,
  getMySubmissionStatsApi,
  getMySubmissionsPaginatedApi,
} from "./submissions";

/** Mentor submission API */
export {
  type MentorSubmission,
  type PaginationMeta as MentorPaginationMeta,
  type SubmissionStats,
  type SubmissionSortField,
  type SubmissionSortOrder,
  type SubmissionListQuery,
  type ReviewDecision,
  type ReviewSubmissionPayload,
  getSubmissionsApi,
  getSubmissionStatsApi,
  updateSubmissionStatusApi,
} from "./mentor-submissions";