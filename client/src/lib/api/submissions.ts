import { apiRequest, ApiRequestError } from "./client";

/** Submission lifecycle states, mirroring the Prisma `SubmissionStatus` enum. */
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Submission {
  id: string;
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
  /** When the project was handed in. */
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
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
 * Resolves to `null` when the student has not submitted a project yet: the API
 * answers that case with `404 Not Found`, which is a definitive "there is
 * nothing here" rather than a failure. Every other error — a 500 included — is
 * re-thrown, so the UI can tell "no submission" apart from "could not load".
 */
export async function getMySubmissionApi(): Promise<Submission | null> {
  try {
    const response = await apiRequest<SubmissionResponse>("/submissions/me");
    return response.data?.submission ?? null;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
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
