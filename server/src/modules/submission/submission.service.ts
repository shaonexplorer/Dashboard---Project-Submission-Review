import { UserRole } from "../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import type { Prisma, SubmissionStatus } from "../../generated/prisma/client";
import { ApiError } from "../../utils/api-error";
import type {
  ResubmitInput,
  SubmissionListQuery,
  StudentSubmissionListQuery,
} from "./submission.validations";

/**
 * Machine-readable discriminators returned alongside a conflicting request.
 *
 * The client branches on the code, never on the message: the message is
 * written for a human, the code is the contract.
 */
export const SUBMISSION_ERROR_CODES = {
  /** The student already handed this project in and it is still under review or approved. */
  DUPLICATE_SUBMISSION: "DUPLICATE_SUBMISSION",
  /** The project was rejected, so the student has to resubmit rather than submit again. */
  RESUBMIT_REQUIRED: "RESUBMIT_REQUIRED",
  /** The submission cannot be resubmitted in its current state. */
  NOT_RESUBMITTABLE: "NOT_RESUBMITTABLE",
} as const;

/**
 * A submission row as it is stored in the database.
 *
 * `feedback` and `reviewedAt` are nullable: a submission is created as PENDING
 * and only gains mentor feedback once a review has been recorded.
 */
type SubmissionRecord = {
  id: string;
  projectId: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: string;
  feedback: string | null;
  reviewedAt: Date | null;
  studentId: string;
  attempt: number;
  resubmittedAt: Date | null;
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
  /** The catalog code of the project this submission belongs to. */
  projectId: submission.projectId,
  projectName: submission.projectName,
  repoUrl: submission.repoUrl,
  liveUrl: submission.liveUrl,
  description: submission.description,
  status: submission.status,
  feedback: submission.feedback,
  reviewedAt: submission.reviewedAt,
  studentId: submission.studentId,
  /** Which attempt this is — 1 for a first hand-in. */
  attempt: submission.attempt,
  /** When this attempt was handed in. `null` on a first attempt. */
  resubmittedAt: submission.resubmittedAt,
  /** When the project was handed in — the row creation timestamp. */
  submittedAt: submission.createdAt,
  createdAt: submission.createdAt,
  updatedAt: submission.updatedAt,
});

/**
 * The student-facing submission shape returned by the API.
 */
export type SafeSubmission = ReturnType<typeof getSafeSubmission>;

/**
 * Builds the error thrown when a student hands the same project in twice.
 *
 * The two cases are told apart by the state of the existing submission: one
 * that is still under review (or already approved) is a plain duplicate, while
 * one that was rejected has to be resubmitted instead of submitted again.
 */
const buildDuplicateError = (existingStatus: string) => {
  if (existingStatus === "REJECTED") {
    return new ApiError(
      409,
      "This project was rejected. Resubmit it with the requested changes.",
      undefined,
      true,
      SUBMISSION_ERROR_CODES.RESUBMIT_REQUIRED,
    );
  }

  return new ApiError(
    409,
    "You have already submitted this project",
    undefined,
    true,
    SUBMISSION_ERROR_CODES.DUPLICATE_SUBMISSION,
  );
};

/**
 * Creates a new project submission for an authenticated student.
 *
 * Business rules enforced:
 * - Only STUDENT role can create submissions
 * - The project must be an active catalog entry
 * - One submission per student per project (enforced at application and
 *   database level)
 * - The project name is written by the server from the catalog, never by the
 *   client
 * - studentId is derived from authenticated user, never from client input
 *
 * @param studentId - ID of the authenticated student (from req.user)
 * @param data - Validated submission data
 * @returns The created submission (safe representation)
 * @throws ApiError(403) if user is not a student
 * @throws ApiError(400) if the project is not in the catalog
 * @throws ApiError(409) if the student already submitted this project
 */
export const createSubmissionService = async (
  studentId: string,
  data: {
    projectId: string;
    repoUrl: string;
    liveUrl: string;
    description: string;
  },
) => {
  // Verify user is a student
  const user = await prisma.user.findUnique({ where: { id: studentId } });
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  if (user.role !== UserRole.STUDENT) {
    throw new ApiError(403, "Forbidden: only students can submit projects");
  }

  // The project is resolved from the catalog, so the display name is written
  // by the server and the client cannot invent one.
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, isActive: true },
    select: { id: true, name: true },
  });

  if (!project) {
    throw new ApiError(400, "Selected project is not available", [
      { field: "projectId", message: "Select a project from the catalog" },
    ]);
  }

  // Application-level duplicate check for this student and this project.
  const existingSubmission = await prisma.submission.findUnique({
    where: { studentId_projectId: { studentId, projectId: project.id } },
    select: { status: true },
  });

  if (existingSubmission) {
    throw buildDuplicateError(existingSubmission.status);
  }

  // Create submission - the database-level @@unique([studentId, projectId])
  // provides race-condition protection for two simultaneous requests.
  try {
    const submission = await prisma.submission.create({
      data: {
        studentId,
        projectId: project.id,
        projectName: project.name,
        repoUrl: data.repoUrl,
        liveUrl: data.liveUrl,
        description: data.description,
        status: "PENDING",
        attempt: 1,
      },
    });

    return getSafeSubmission(submission);
  } catch (error) {
    // Handle Prisma unique constraint violation (P2002) for concurrent duplicates
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const prismaError = error as {
        meta?: { target?: string[] | string; modelName?: string };
      };
      const target = prismaError.meta?.target;
      const targets = Array.isArray(target)
        ? target
        : typeof target === "string"
          ? [target]
          : [];

      /**
       * `@@unique([studentId, projectId])` is the only unique constraint on
       * Submission, so a unique violation on that model is the duplicate
       * conflict. The constraint's columns are used when the driver reports
       * them; when it does not — some driver-adapter paths omit the target —
       * the model name is enough to tell the conflict apart from every other
       * failure, because nothing else on Submission is unique.
       */
      const isStudentProjectKey =
        targets.length === 0
          ? prismaError.meta?.modelName === "Submission"
          : targets.includes("studentId_projectId") ||
            (targets.includes("studentId") && targets.includes("projectId"));

      if (isStudentProjectKey) {
        // The race was lost to another request for the same student and
        // project. Re-read the winning row so the response carries the same
        // discriminator the pre-check would have produced.
        const winner = await prisma.submission.findUnique({
          where: { studentId_projectId: { studentId, projectId: project.id } },
          select: { status: true },
        });

        throw buildDuplicateError(winner?.status ?? "PENDING");
      }
    }
    throw error;
  }
};

/**
 * Retrieves every submission a student has made.
 *
 * The student identity always comes from the authenticated request context, so
 * a client can never widen the lookup to another student's records.
 *
 * The list is never empty-by-error: a student who has not submitted anything
 * simply gets an empty array. An empty list and a failed request are two
 * different answers, and only one of them is a 404.
 *
 * @param studentId - ID of the authenticated student
 * @returns The student's submissions, most recently handed in first
 */
export const getStudentSubmissionsService = async (studentId: string) => {
  const submissions = await prisma.submission.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
        },
      },
    },
  });

  return submissions.map((submission) => ({
    ...getSafeSubmission(submission),
    project: {
      id: submission.project.id,
      name: submission.project.name,
      description: submission.project.description,
      isActive: submission.project.isActive,
    },
  }));
};

/**
 * Builds the Prisma `where` clause for a student submission list request.
 *
 * Status and search combine with AND semantics. A blank search is dropped
 * rather than turned into a filter that matches nothing.
 */
const buildStudentSubmissionWhere = (
  studentId: string,
  query: StudentSubmissionListQuery,
): Prisma.SubmissionWhereInput => {
  const where: Prisma.SubmissionWhereInput = { studentId };

  if (query.status) {
    where.status = query.status;
  }

  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { projectName: { contains: search, mode: "insensitive" } },
      { projectId: { contains: search, mode: "insensitive" } },
      { repoUrl: { contains: search, mode: "insensitive" } },
      { liveUrl: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
};

/**
 * Builds the Prisma `orderBy` clause for a student submission list request.
 *
 * The field is picked explicitly rather than spread from the client value,
 * so only whitelisted columns can ever be sorted on.
 */
const buildStudentSubmissionOrderBy = (
  sortBy: StudentSubmissionListQuery["sortBy"],
  sortOrder: StudentSubmissionListQuery["sortOrder"],
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
 * Lists submissions for the student's own table.
 *
 * Every table operation — pagination, filtering, searching and sorting — is
 * performed by the database. The rows are never fetched in full and filtered
 * in application memory.
 *
 * Authorization is enforced by the `authorize("STUDENT")` middleware on the
 * route, before this service is reached.
 *
 * @param studentId - ID of the authenticated student
 * @param query - The normalized list query (already validated)
 * @returns The requested page of submissions plus its pagination metadata
 */
export const getStudentSubmissionsPaginatedService = async (
  studentId: string,
  query: StudentSubmissionListQuery,
) => {
  const { page, limit, sortBy, sortOrder } = query;

  const where = buildStudentSubmissionWhere(studentId, query);
  const orderBy = buildStudentSubmissionOrderBy(sortBy, sortOrder);
  const skip = (page - 1) * limit;

  // The list and the count share one `where` clause, so the pagination
  // metadata always describes the same data set the rows came from.
  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  const data = submissions.map((submission) => ({
    ...getSafeSubmission(submission),
    project: {
      id: submission.project.id,
      name: submission.project.name,
      description: submission.project.description,
      isActive: submission.project.isActive,
    },
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

/**
 * Replaces the deliverable of a rejected submission.
 *
 * A resubmission reuses the existing row instead of creating a second one:
 * the attempt counter goes up, the row returns to PENDING, and the previous
 * review is kept so the student can still see what the mentor asked for.
 *
 * The project is never changed by a resubmission — the row stays on the
 * project it was made for, and the client cannot choose a different one.
 *
 * @param studentId - ID of the authenticated student
 * @param submissionId - ID of the submission being resubmitted
 * @param data - The validated deliverable
 * @returns The updated submission (safe representation)
 * @throws ApiError(404) if the submission does not exist or belongs to somebody else
 * @throws ApiError(409) if the submission is not in a resubmittable state
 */
export const resubmitSubmissionService = async (
  studentId: string,
  submissionId: string,
  data: ResubmitInput,
) => {
  const existing = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      studentId: true,
      status: true,
      attempt: true,
    },
  });

  // A submission owned by somebody else is reported as missing rather than
  // forbidden: the student has no business learning that it exists.
  if (!existing || existing.studentId !== studentId) {
    throw new ApiError(404, "Submission not found");
  }

  if (existing.status !== "REJECTED") {
    throw new ApiError(
      409,
      "This submission cannot be resubmitted",
      undefined,
      true,
      SUBMISSION_ERROR_CODES.NOT_RESUBMITTABLE,
    );
  }

  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      repoUrl: data.repoUrl,
      liveUrl: data.liveUrl,
      description: data.description,
      status: "PENDING",
      attempt: { increment: 1 },
      resubmittedAt: new Date(),
      // The previous review is deliberately left in place: the feedback,
      // the reviewer and the review timestamp describe the attempt that was
      // rejected, and the student is still working against them.
    },
  });

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
  projectId: true,
  projectName: true,
  repoUrl: true,
  liveUrl: true,
  description: true,
  status: true,
  feedback: true,
  reviewedAt: true,
  studentId: true,
  attempt: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.SubmissionSelect;

/** A submission row as it is read back for a mentor. */
type MentorSubmissionRow = {
  id: string;
  projectId: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: SubmissionStatus;
  feedback: string | null;
  reviewedAt: Date | null;
  studentId: string;
  attempt: number;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    name: string | null;
    email: string | null;
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
const buildSubmissionWhere = (
  query: SubmissionListQuery,
): Prisma.SubmissionWhereInput => {
  const where: Prisma.SubmissionWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.projectId) {
    where.projectId = query.projectId;
  }

  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { projectName: { contains: search, mode: "insensitive" } },
      { student: { name: { contains: search, mode: "insensitive" } } },
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
  sortOrder: SubmissionListQuery["sortOrder"],
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

/**
 * The aggregate counts rendered by the mentor dashboard's statistics cards.
 */
export type SubmissionStats = {
  /** Every submission in the table. */
  total: number;
  /** Submissions still waiting for a review decision. */
  pending: number;
  /** Submissions a mentor has approved. */
  approved: number;
  /** Submissions a mentor has rejected. */
  rejected: number;
};

/**
 * The aggregate counts for a student's own submissions.
 *
 * Includes "active" (pending/in-review) and "archived" (approved + rejected)
 * to match the UI status filter tabs.
 */
export type StudentSubmissionStats = {
  /** Every submission the student has made. */
  total: number;
  /** Submissions currently under review (PENDING). */
  pending: number;
  /** Alias for pending — shown as "Active / In Progress" in UI. */
  active: number;
  /** Submissions that have been approved. */
  approved: number;
  /** Submissions that have been rejected (changes required). */
  rejected: number;
  /** Alias for approved + rejected — shown as "Archived" in UI. */
  archived: number;
};

/**
 * Aggregates submission counts by status for the mentor dashboard.
 *
 * Both readings come from the database and are issued together, so the
 * endpoint waits for one round of database work rather than two sequential
 * ones. The total is read with its own count query instead of being summed
 * from the status groups, so the figure the dashboard shows as "Total
 * submissions" is an independent reading of the table.
 *
 * The counts describe the whole table. They are never derived from a
 * paginated result, which would describe one slice of rows rather than the
 * submissions themselves.
 *
 * Authorization is enforced by the `authorize("MENTOR")` middleware on the
 * route, before this service is reached.
 *
 * @returns The total count and the per-status breakdown
 */
export const getSubmissionStatsService = async (): Promise<SubmissionStats> => {
  const [total, groups] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  // Every count starts at zero: a status with no rows is simply absent from
  // the grouping, and must still be reported as 0 rather than left undefined.
  const stats: SubmissionStats = {
    total,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  for (const group of groups) {
    const count = group._count._all;

    if (group.status === "PENDING") {
      stats.pending = count;
    } else if (group.status === "APPROVED") {
      stats.approved = count;
    } else if (group.status === "REJECTED") {
      stats.rejected = count;
    }
  }

  return stats;
};

/**
 * Aggregates submission counts for the authenticated student.
 *
 * Performs a single grouped count query filtered by studentId, then derives
 * the UI-friendly counts (active = pending, archived = approved + rejected).
 *
 * @param studentId - ID of the authenticated student
 * @returns The total and per-status breakdown for the student
 */
export const getStudentSubmissionStatsService = async (
  studentId: string,
): Promise<StudentSubmissionStats> => {
  const [total, groups] = await Promise.all([
    prisma.submission.count({ where: { studentId } }),
    prisma.submission.groupBy({
      by: ["status"],
      where: { studentId },
      _count: { _all: true },
    }),
  ]);

  const stats: StudentSubmissionStats = {
    total,
    pending: 0,
    active: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
  };

  for (const group of groups) {
    const count = group._count._all;

    if (group.status === "PENDING") {
      stats.pending = count;
      stats.active = count; // Active = pending for student view
    } else if (group.status === "APPROVED") {
      stats.approved = count;
      stats.archived += count;
    } else if (group.status === "REJECTED") {
      stats.rejected = count;
      stats.archived += count;
    }
  }

  return stats;
};

/**
 * Records a mentor's review decision on a submission.
 *
 * The decision, the feedback and the reviewer are written together, so a
 * submission can never end up marked as reviewed without saying who reviewed
 * it or when.
 *
 * The reviewer identity comes from the authenticated request context, never
 * from the client payload, so a mentor can only ever record a review under
 * their own name.
 *
 * Authorization is enforced by the `authorize("MENTOR")` middleware on the
 * route, before this service is reached.
 *
 * @param reviewerId - ID of the authenticated mentor
 * @param submissionId - ID of the submission being reviewed
 * @param data - The validated review decision
 * @returns The updated submission in the mentor list shape
 * @throws ApiError(404) if the submission does not exist
 */
export const updateSubmissionStatusService = async (
  reviewerId: string,
  submissionId: string,
  data: { status: "APPROVED" | "REJECTED"; feedback?: string },
) => {
  const existing = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(404, "Submission not found");
  }

  // A blank feedback box is stored as "no feedback" rather than as an empty
  // string, so the student view can tell "not reviewed" from "reviewed".
  const feedback = data.feedback?.trim();

  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: data.status,
      feedback: feedback && feedback.length > 0 ? feedback : null,
      reviewedAt: new Date(),
      reviewedById: reviewerId,
    },
    select: MENTOR_SUBMISSION_SELECT,
  });

  return {
    ...submission,
    submittedAt: submission.createdAt,
  };
};
