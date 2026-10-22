import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendPaginatedResponse, sendResponse } from "../../utils/api-response";
import {
  createSubmissionService,
  getStudentSubmissionsService,
  getStudentSubmissionsPaginatedService,
  getStudentSubmissionStatsService,
  getSubmissionsService,
  getSubmissionStatsService,
  resubmitSubmissionService,
  updateSubmissionStatusService,
} from "./submission.service";
import type {
  ResubmitInput,
  SubmissionIdParams,
  SubmissionListQuery,
  StudentSubmissionListQuery,
  StudentSubmissionStatsQuery,
  SubmissionStatusUpdateInput,
} from "./submission.validations";

/**
 * Creates a new project submission for the authenticated student.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 * - STUDENT role (handled by authorize("STUDENT") middleware)
 * - Valid request body (handled by validate(submissionSchema) middleware)
 * - Rate limiting (handled by submissionRateLimiter middleware)
 *
 * Returns 201 Created with the new submission on success.
 */
export const createSubmissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { projectId, repoUrl, liveUrl, description } = req.body as {
      projectId: string;
      repoUrl: string;
      liveUrl: string;
      description: string;
    };

    const submission = await createSubmissionService(studentId, {
      projectId,
      repoUrl,
      liveUrl,
      description,
    });

    sendResponse(res, 201, "Project submitted successfully", { submission });
  }
);

/**
 * Retrieves the authenticated student's own submissions.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 * - STUDENT role (handled by authorize("STUDENT") middleware)
 *
 * The student identity is taken from the authenticated request context, never
 * from the client, so a student can only ever reach their own submissions.
 *
 * Returns 200 OK with the student's submissions, most recent first. A student
 * who has not submitted anything gets an empty list — not a 404, because
 * "nothing submitted yet" is an answer, not a failure.
 */
export const getMySubmissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    const submissions = await getStudentSubmissionsService(studentId);

    sendResponse(res, 200, "Submissions retrieved", { submissions });
  }
);

/**
 * Retrieves the authenticated student's own submissions with pagination,
 * filtering, searching and sorting.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 * - STUDENT role (handled by authorize("STUDENT") middleware)
 * - Valid query parameters (handled by validate(studentSubmissionListQuerySchema) middleware)
 *
 * The query has already been parsed and normalized by the validation
 * middleware, so the controller only forwards it to the service.
 *
 * Returns 200 OK with the requested page of submissions and its pagination
 * metadata.
 */
export const getMySubmissionsPaginatedController = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const query = req.query as unknown as StudentSubmissionListQuery;

    const { data, pagination } = await getStudentSubmissionsPaginatedService(
      studentId,
      query
    );

    sendPaginatedResponse(res, 200, "Submissions retrieved", data, pagination);
  }
);

/**
 * Retrieves aggregate submission counts for the authenticated student.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 * - STUDENT role (handled by authorize("STUDENT") middleware)
 *
 * Returns 200 OK with the total and per-status breakdown.
 */
export const getMySubmissionStatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    const stats = await getStudentSubmissionStatsService(studentId);

    sendResponse(res, 200, "Submission statistics retrieved", stats);
  }
);

/**
 * Replaces the deliverable of a rejected submission.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 * - STUDENT role (handled by authorize("STUDENT") middleware)
 * - A valid submission id (handled by validate(submissionIdParamSchema) middleware)
 * - A valid body (handled by validate(resubmitSchema) middleware)
 *
 * The submission is always the authenticated student's own: the id is matched
 * against the row's owner, so a student can never resubmit somebody else's
 * work.
 *
 * Returns 200 OK with the updated submission on success.
 */
export const resubmitSubmissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { id } = req.params as unknown as SubmissionIdParams;
    const { repoUrl, liveUrl, description } = req.body as ResubmitInput;

    const submission = await resubmitSubmissionService(studentId, id, {
      repoUrl,
      liveUrl,
      description,
    });

    sendResponse(res, 200, "Submission resubmitted successfully", { submission });
  }
);

/**
 * Lists project submissions for the mentor table.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 * - MENTOR role (handled by authorize("MENTOR") middleware)
 * - Valid query parameters (handled by validate(submissionListQuerySchema) middleware)
 *
 * The query has already been parsed and normalized by the validation
 * middleware, so the controller only forwards it to the service.
 *
 * Returns 200 OK with the requested page of submissions and its pagination
 * metadata.
 */
export const getSubmissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as SubmissionListQuery;

    const { data, pagination } = await getSubmissionsService(query);

    sendPaginatedResponse(res, 200, "Submissions retrieved", data, pagination);
  }
);

/**
 * Returns the aggregate submission counts for the mentor dashboard's
 * statistics cards.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 * - MENTOR role (handled by authorize("MENTOR") middleware)
 *
 * The counting is done by the database — the controller only forwards the
 * aggregated result.
 *
 * Returns 200 OK with the total and the per-status breakdown.
 */
export const getSubmissionStatsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await getSubmissionStatsService();

    sendResponse(res, 200, "Submission statistics retrieved", stats);
  }
);

/**
 * Records a mentor's review decision on a submission.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 * - MENTOR role (handled by authorize("MENTOR") middleware)
 * - A valid submission id (handled by validate(submissionIdParamSchema) middleware)
 * - A valid review body (handled by validate(submissionStatusUpdateSchema) middleware)
 *
 * The reviewer identity is taken from the authenticated request context, never
 * from the client, so a mentor can only ever record a review under their own
 * name.
 *
 * Returns 200 OK with the updated submission on success.
 */
export const updateSubmissionStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const reviewerId = req.user!.id;
    const { id } = req.params as unknown as SubmissionIdParams;
    const { status, feedback } = req.body as SubmissionStatusUpdateInput;

    const submission = await updateSubmissionStatusService(reviewerId, id, {
      status,
      feedback,
    });

    sendResponse(res, 200, "Submission status updated", { submission });
  }
);
