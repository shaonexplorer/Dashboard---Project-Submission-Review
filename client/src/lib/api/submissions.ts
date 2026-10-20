import { apiRequest, ApiRequestError } from "./client";

/** Submission lifecycle states, mirroring the Prisma `SubmissionStatus` enum. */
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Submission {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: SubmissionStatus;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Mentor feedback. Optional on the client because the current API response
   * does not expose it yet — the review UI renders the block only when present.
   */
  feedback?: string | null;
  /** Timestamp of the mentor decision, when the submission has been reviewed. */
  reviewedAt?: string | null;
}

/** Payload accepted by `POST /api/submissions`. Ownership is decided server-side. */
export interface CreateSubmissionPayload {
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  data?: { submission: Submission | null };
}

/**
 * Fetches the authenticated student's own submission.
 *
 * Resolves to `null` when the student has not submitted a project yet.
 */
export async function getMySubmissionApi(): Promise<Submission | null> {
  const response = await apiRequest<SubmissionResponse>("/submissions/me");
  return response.data?.submission ?? null;
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
