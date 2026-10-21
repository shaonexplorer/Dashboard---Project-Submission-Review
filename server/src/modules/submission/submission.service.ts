import { UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { Prisma, SubmissionStatus } from "../../generated/prisma/client";
import { ApiError } from "../../utils/api-error";
import type { SubmissionListQuery } from "./submission.validations";

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

/**
 * Fields selected for a mentor-facing submission row.
 *
 * Only what the mentor table renders is selected — the student's password
 * hash and any other account data never leave the database.
 */
const MENTOR_SUBMISSION_SELECT = {
  id: true,
  projectName: true,
  repoUrl: true,
  liveUrl: true,
  description: true,
  status: true,
  feedback: true,
  reviewedAt: true,
  studentId: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} satisfies Prisma.SubmissionSelect;

/** A submission row as it is read back for a mentor. */
type MentorSubmissionRow = {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: SubmissionStatus;
  feedback: string | null;
  reviewedAt: Date | null;
  studentId: string;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
};

/**
 * A submission row in the shape the mentor list returns.
 *
 * Mirrors the student-facing contract and adds the student identity the
 * mentor table renders.
 */
export type MentorSubmission = MentorSubmissionRow & {
  /** When the project was handed in — the row creation timestamp. */
  submittedAt: Date;
};

/**
 * Builds the Prisma `where` clause for a mentor list request.
 *
 * Status and search combine with AND semantics, while the three searchable
 * fields combine with OR semantics. A blank search is dropped rather than
 * turned into a filter that matches nothing.
 */
const buildSubmissionWhere = (query: SubmissionListQuery): Prisma.SubmissionWhereInput => {
  const where: Prisma.SubmissionWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { projectName: { contains: search, mode: "insensitive" } },
      { student: { fullName: { contains: search, mode: "insensitive" } } },
      { student: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
};

/**
 * Builds the Prisma `orderBy` clause for a mentor list request.
 *
 * The field is picked explicitly rather than spread from the client value,
 * so only whitelisted columns can ever be sorted on.
 */
const buildSubmissionOrderBy = (
  sortBy: SubmissionListQuery["sortBy"],
  sortOrder: SubmissionListQuery["sortOrder"]
): Prisma.SubmissionOrderByWithRelationInput => {
  if (sortBy === "projectName") {
    return { projectName: sortOrder };
  }

  if (sortBy === "status") {
    return { status: sortOrder };
  }

  return { createdAt: sortOrder };
};

/**
 * Lists submissions for the mentor table.
 *
 * Every table operation — pagination, filtering, searching and sorting — is
 * performed by the database. The rows are never fetched in full and filtered
 * in application memory.
 *
 * Authorization is enforced by the `authorize("MENTOR")` middleware on the
 * route, before this service is reached.
 *
 * @param query - The normalized list query (already validated)
 * @returns The requested page of submissions plus its pagination metadata
 */
export const getSubmissionsService = async (query: SubmissionListQuery) => {
  const { page, limit, sortBy, sortOrder } = query;

  const where = buildSubmissionWhere(query);
  const orderBy = buildSubmissionOrderBy(sortBy, sortOrder);
  const skip = (page - 1) * limit;

  // The list and the count share one `where` clause, so the pagination
  // metadata always describes the same data set the rows came from.
  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: MENTOR_SUBMISSION_SELECT,
    }),
    prisma.submission.count({ where }),
  ]);

  const data: MentorSubmission[] = submissions.map((submission) => ({
    ...submission,
    submittedAt: submission.createdAt,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};