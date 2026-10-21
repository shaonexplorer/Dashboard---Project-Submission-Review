import { apiRequest, ApiRequestError } from "./client";

/** Submission lifecycle states, mirroring the Prisma `SubmissionStatus` enum. */
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

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

interface SubmissionsResponse {
  success: boolean;
  message: string;
  data?: { submissions?: Submission[] };
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  data?: { submission?: Submission };
}

/**
 * Fetches every submission the authenticated student owns.
 *
 * The list is empty when the student has not submitted anything yet — that is
 * a normal state, not a failure, so the endpoint answers `200` with an empty
 * array rather than a `404`. The response is therefore never treated as a
 * failure here: only a real request failure is.
 */
export async function getMySubmissionsApi(): Promise<Submission[]> {
  const response = await apiRequest<SubmissionsResponse>("/submissions/me");
  return response.data?.submissions ?? [];
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
  const response = await apiRequest<SubmissionResponse>("/submissions", {
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
  const response = await apiRequest<SubmissionResponse>(
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
