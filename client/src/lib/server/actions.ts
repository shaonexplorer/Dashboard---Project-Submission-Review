"use server";

import {
  createSubmissionServer,
  resubmitSubmissionServer,
  updateSubmissionStatusServer,
  type CreateSubmissionPayload,
  type ResubmitSubmissionPayload,
  type ReviewSubmissionPayload,
  type Submission,
  type MentorSubmission,
  ServerApiError,
} from "@/lib/server/api";
import { revalidateTag } from "next/cache";

/**
 * Server Action: Create a new project submission.
 * Revalidates the student submissions cache after success.
 */
export async function createSubmissionAction(
  payload: CreateSubmissionPayload,
): Promise<{ success: true; data: Submission } | { success: false; error: string; code?: string; fieldErrors?: Array<{ field: string; message: string }> }> {
  try {
    const submission = await createSubmissionServer(payload);
    // Revalidate relevant queries
    revalidateTag("student-submissions");
    revalidateTag("student-submissions-paginated");
    revalidateTag("student-submission-stats");
    return { success: true, data: submission };
  } catch (error) {
    if (error instanceof ServerApiError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        fieldErrors: error.fieldErrors,
      };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Server Action: Resubmit a rejected submission.
 * Revalidates the student submissions cache after success.
 */
export async function resubmitSubmissionAction(
  submissionId: string,
  payload: ResubmitSubmissionPayload,
): Promise<{ success: true; data: Submission } | { success: false; error: string; code?: string; fieldErrors?: Array<{ field: string; message: string }> }> {
  try {
    const submission = await resubmitSubmissionServer(submissionId, payload);
    revalidateTag("student-submissions");
    revalidateTag("student-submissions-paginated");
    revalidateTag("student-submission-stats");
    revalidateTag(`submission-${submissionId}`);
    return { success: true, data: submission };
  } catch (error) {
    if (error instanceof ServerApiError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        fieldErrors: error.fieldErrors,
      };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Server Action: Update submission status (mentor review).
 * Revalidates mentor dashboard cache after success.
 */
export async function updateSubmissionStatusAction(
  submissionId: string,
  payload: ReviewSubmissionPayload,
): Promise<{ success: true; data: MentorSubmission } | { success: false; error: string; code?: string; fieldErrors?: Array<{ field: string; message: string }> }> {
  try {
    const submission = await updateSubmissionStatusServer(submissionId, payload);
    revalidateTag("mentor-submissions");
    revalidateTag("mentor-submission-stats");
    revalidateTag(`submission-${submissionId}`);
    return { success: true, data: submission };
  } catch (error) {
    if (error instanceof ServerApiError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        fieldErrors: error.fieldErrors,
      };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}