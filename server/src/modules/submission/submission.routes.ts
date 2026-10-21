import express from "express";

import { validate } from "../../middleware/validate.middleware";
import { authenticate, authorize } from "../auth/auth.middleware";
import { submissionRateLimiter } from "./submissionRateLimiter.middleware";
import {
  submissionIdParamSchema,
  submissionListQuerySchema,
  submissionSchema,
  submissionStatusUpdateSchema,
} from "./submission.validations";
import {
  createSubmissionController,
  getMySubmissionController,
  getSubmissionsController,
  getSubmissionStatsController,
  updateSubmissionStatusController,
} from "./submission.controller";

const router = express.Router();

/**
 * POST /api/submissions
 *
 * Creates a new project submission for the authenticated student.
 *
 * Middleware chain:
 * 1. submissionRateLimiter - 5 requests per 10 minutes per IP
 * 2. authenticate - Verifies JWT token from cookie
 * 3. authorize("STUDENT") - Ensures user has STUDENT role
 * 3. validate(submissionSchema) - Validates request body
 *
 * Responses:
 * - 201 Created: Submission created successfully
 * - 400 Bad Request: Validation failed
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a STUDENT
 * - 409 Conflict: Student already has a submission
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: Unexpected error
 */
router.post(
  "/",
  submissionRateLimiter,
  authenticate,
  authorize("STUDENT"),
  validate(submissionSchema, "body"),
  createSubmissionController
);

/**
 * GET /api/submissions/me
 *
 * Retrieves the authenticated student's own submission.
 *
 * Middleware chain:
 * 1. authenticate - Verifies JWT token from cookie
 * 2. authorize("STUDENT") - Ensures user has STUDENT role
 *
 * Responses:
 * - 200 OK: Submission retrieved
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a STUDENT
 * - 404 Not Found: The student has not submitted a project yet
 * - 500 Internal Server Error: Unexpected error
 *
 * Note: this route must stay registered before any dynamic `/:id` route, so
 * that "me" is never interpreted as a submission identifier.
 */
router.get(
  "/me",
  authenticate,
  authorize("STUDENT"),
  getMySubmissionController
);

/**
 * GET /api/submissions/stats
 *
 * Returns the aggregate submission counts for the mentor dashboard's
 * statistics cards: the total number of submissions and the per-status
 * breakdown. The counts are produced by database aggregation and always
 * describe the whole table — the endpoint takes no query parameters.
 *
 * Middleware chain:
 * 1. authenticate - Verifies JWT token from cookie
 * 2. authorize("MENTOR") - Ensures user has MENTOR role
 *
 * Responses:
 * - 200 OK: The total and per-status counts
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a MENTOR
 * - 500 Internal Server Error: Unexpected error
 *
 * Note: this route must stay registered before any dynamic `/:id` route, so
 * that "stats" is never interpreted as a submission identifier.
 */
router.get(
  "/stats",
  authenticate,
  authorize("MENTOR"),
  getSubmissionStatsController
);

/**
 * GET /api/submissions
 *
 * Lists every project submission for mentors, with server-side pagination,
 * status filtering, search and sorting. All table operations are driven by
 * query parameters.
 *
 * Middleware chain:
 * 1. authenticate - Verifies JWT token from cookie
 * 2. authorize("MENTOR") - Ensures user has MENTOR role
 * 3. validate(submissionListQuerySchema, "query") - Validates and normalizes
 *    the query parameters
 *
 * Query parameters:
 * - page: positive integer, defaults to 1
 * - limit: positive integer, at most 100, defaults to 10
 * - status: PENDING | APPROVED | REJECTED
 * - search: matched against project name, student name and student email
 * - sortBy: createdAt | projectName | status, defaults to createdAt
 * - sortOrder: asc | desc, defaults to desc
 *
 * Responses:
 * - 200 OK: Paginated list of submissions
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a MENTOR
 * - 500 Internal Server Error: Unexpected error
 */
router.get(
  "/",
  authenticate,
  authorize("MENTOR"),
  validate(submissionListQuerySchema, "query"),
  getSubmissionsController
);

/**
 * PATCH /api/submissions/:id/status
 *
 * Records a mentor's review decision on a submission. The status, the
 * feedback, the reviewer and the review timestamp are written together.
 *
 * Middleware chain:
 * 1. authenticate - Verifies JWT token from cookie
 * 2. authorize("MENTOR") - Ensures user has MENTOR role
 * 3. validate(submissionIdParamSchema, "params") - Validates the submission id
 * 4. validate(submissionStatusUpdateSchema, "body") - Validates the decision
 *
 * Responses:
 * - 200 OK: The updated submission
 * - 400 Bad Request: Invalid submission id or review body
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a MENTOR
 * - 404 Not Found: No submission with that id
 * - 500 Internal Server Error: Unexpected error
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize("MENTOR"),
  validate(submissionIdParamSchema, "params"),
  validate(submissionStatusUpdateSchema, "body"),
  updateSubmissionStatusController
);

export default router;