import { UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/api-error";

/**
 * Returns submission data safe for API responses.
 */
export const getSafeSubmission = (submission: {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: string;
  studentId: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: submission.id,
  projectName: submission.projectName,
  repoUrl: submission.repoUrl,
  liveUrl: submission.liveUrl,
  description: submission.description,
  status: submission.status,
  studentId: submission.studentId,
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
 * @param studentId - ID of the authenticated student
 * @returns The submission or null if none exists
 */
export const getStudentSubmissionService = async (studentId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { studentId },
  });

  if (!submission) {
    return null;
  }

  return getSafeSubmission(submission);
};