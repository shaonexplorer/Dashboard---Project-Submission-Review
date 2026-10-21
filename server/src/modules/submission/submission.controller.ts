import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendPaginatedResponse, sendResponse } from "../../utils/api-response";
import {
  createSubmissionService,
  getStudentSubmissionService,
  getSubmissionsService,
  getSubmissionStatsService,
  updateSubmissionStatusService,
} from "./submission.service";
import type {
  SubmissionIdParams,
  SubmissionListQuery,
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
    const { projectName, repoUrl, liveUrl, description } = req.body as {
      projectName: string;
      repoUrl: string;
      liveUrl: string;
      description: string;
    };

    const submission = await createSubmissionService(studentId, {
      projectName,
      repoUrl,
      liveUrl,
      description,
    });

    sendResponse(res, 201, "Project submitted successfully", { submission });
  }
);

/**
 * Retrieves the authenticated student's own submission.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 * - STUDENT role (handled by authorize("STUDENT") middleware)
 *
 * The student identity is taken from the authenticated request context, never
 * from the client, so a student can only ever reach their own submission.
 *
 * Returns 200 OK with the submission, or 404 Not Found when the student has
 * not submitted a project yet. The not-found case is a definitive answer
 * ("there is nothing here"), which is what lets the frontend tell it apart
 * from an unexpected server failure.
 */
export const getMySubmissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    const submission = await getStudentSubmissionService(studentId);

    sendResponse(res, 200, "Submission retrieved", { submission });
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