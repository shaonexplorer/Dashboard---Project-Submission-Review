import { UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/api-error";

/**
 * A submission row as it is stored in the database.
 *
 * `feedback` and `reviewedAt` are nullable: a submission is created as PENDING
 * and only gains mentor feedback once a review has been recorded.
 */
type SubmissionRecord = {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: string;
  feedback: string | null;
  reviewedAt: Date | null;
  studentId: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Returns submission data safe for API responses.
 *
 * Reviewer metadata (`reviewedById`) is deliberately left out — the
 * student-facing contract exposes only what the submission UI renders.
 */
export const getSafeSubmission = (submission: SubmissionRecord) => ({
  id: submission.id,
  projectName: submission.projectName,
  repoUrl: submission.repoUrl,
  liveUrl: submission.liveUrl,
  description: submission.description,
  status: submission.status,
  feedback: submission.feedback,
  reviewedAt: submission.reviewedAt,
  studentId: submission.studentId,
  /** When the project was handed in — the row creation timestamp. */
  submittedAt: submission.createdAt,
  createdAt: submission.createdAt,
  updatedAt: submission.updatedAt,
});

/**
 * Creates a new project submission for an authenticated student.
 *
 * Business rules enforced:
 * - Only STUDENT role can create submissions
 * - One submission per student (enforced at application and database level)
 * - studentId is derived from authenticated user, never from client input
 *
 * @param studentId - ID of the authenticated student (from req.user)
 * @param data - Validated submission data
 * @returns The created submission (safe representation)
 * @throws ApiError(403) if user is not a student
 * @throws ApiError(409) if student already has a submission (application-level or DB-level)
 */
export const createSubmissionService = async (
  studentId: string,
  data: { projectName: string; repoUrl: string; liveUrl: string; description: string }
) => {
  // Verify user is a student
  const user = await prisma.user.findUnique({ where: { id: studentId } });
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  if (user.role !== UserRole.STUDENT) {
    throw new ApiError(403, "Forbidden: only students can submit projects");
  }

  // Application-level duplicate check
  const existingSubmission = await prisma.submission.findUnique({
    where: { studentId },
  });

  if (existingSubmission) {
    throw new ApiError(409, "You have already submitted a project");
  }

  // Create submission - database-level @unique on studentId provides race-condition protection
  try {
    const submission = await prisma.submission.create({
      data: {
        studentId,
        projectName: data.projectName,
        repoUrl: data.repoUrl,
        liveUrl: data.liveUrl,
        description: data.description,
        status: "PENDING",
      },
    });

    return getSafeSubmission(submission);
  } catch (error) {
    // Handle Prisma unique constraint violation (P2002) for concurrent duplicates
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const prismaError = error as { meta?: { target?: string[] } };
      if (prismaError.meta?.target?.includes("studentId")) {
        throw new ApiError(409, "You have already submitted a project");
      }
    }
    throw error;
  }
};

/**
 * Retrieves a student's own submission.
 *
 * The student identity always comes from the authenticated request context, so
 * a client can never widen the lookup to another student's record.
 *
 * @param studentId - ID of the authenticated student
 * @returns The submission belonging to that student
 * @throws ApiError(404) if the student has not submitted a project yet
 */
export const getStudentSubmissionService = async (studentId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { studentId },
  });

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  return getSafeSubmission(submission);
};