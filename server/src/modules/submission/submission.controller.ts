import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/api-response";
import { createSubmissionService, getStudentSubmissionService } from "./submission.service";

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