import express from "express";

import { validate } from "../../middleware/validate.middleware";
import { authenticate, authorize } from "../auth/auth.middleware";
import { submissionRateLimiter } from "./submissionRateLimiter.middleware";
import {
  resubmitSchema,
  submissionIdParamSchema,
  submissionListQuerySchema,
  studentSubmissionListQuerySchema,
  studentSubmissionStatsQuerySchema,
  submissionSchema,
  submissionStatusUpdateSchema,
} from "./submission.validations";
import {
  createSubmissionController,
  getMySubmissionController,
  getMySubmissionsPaginatedController,
  getMySubmissionStatsController,
  getSubmissionsController,
  getSubmissionStatsController,
  resubmitSubmissionController,
  updateSubmissionStatusController,
} from "./submission.controller";

const router = express.Router();

/**
 * POST /api/submissions
 *
 * Creates a new project submission for the authenticated student.
 *
 * Middleware chain:
 * 1. authenticate - Verifies JWT token from cookie
 * 2. authorize("STUDENT") - Ensures user has STUDENT role
 * 3. submissionRateLimiter - 20 requests per 10 minutes per user
 * 4. validate(submissionSchema) - Validates request body
 *
 * The rate limiter runs after authentication so it can key on the student's
 * user id rather than on the shared IP address.
 *
 * Responses:
 * - 201 Created: Submission created successfully
 * - 400 Bad Request: Validation failed, or the project is not in the catalog
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a STUDENT
 * - 409 Conflict: Student already submitted this project
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: Unexpected error
 */
router.post(
  "/",
  authenticate,
  authorize("STUDENT"),
  submissionRateLimiter,
  validate(submissionSchema, "body"),
  createSubmissionController
);

/**
 * GET /api/submissions/me
 *
 * Retrieves the authenticated student's own submissions with server-side
 * pagination, status filtering, search and sorting. All table operations are
 * driven by query parameters.
 *
 * This single route replaces the non-paginated endpoint — the query schema
 * provides defaults so a request without parameters returns page 1 (10 items,
 * newest first), which is the same result the old endpoint produced.
 *
 * Middleware chain:
 * 1. authenticate - Verifies JWT token from cookie
 * 2. authorize("STUDENT") - Ensures user has STUDENT role
 * 3. validate(studentSubmissionListQuerySchema, "query") - Validates and
 *    normalizes the query parameters
 *
 * Query parameters:
 * - page: positive integer, defaults to 1
 * - limit: positive integer, at most 100, defaults to 10
 * - status: PENDING | APPROVED | REJECTED
 * - search: matched against project name, project code, repo URL, live URL, description
 * - sortBy: createdAt | projectName | status, defaults to createdAt
 * - sortOrder: asc | desc, defaults to desc
 *
 * Responses:
 * - 200 OK: Paginated list of submissions with pagination metadata
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a STUDENT
 * - 500 Internal Server Error: Unexpected error
 *
 * Note: this route must stay registered before any dynamic `/:id` route, so
 * that "me" is never interpreted as a submission identifier.
 */
router.get(
  "/me",
  authenticate,
  authorize("STUDENT"),
  validate(studentSubmissionListQuerySchema, "query"),
  getMySubmissionsPaginatedController
);

/**
 * GET /api/submissions/me/stats
 *
 * Retrieves aggregate submission counts for the authenticated student.
 *
 * Middleware chain:
 * 1. authenticate - Verifies JWT token from cookie
 * 2. authorize("STUDENT") - Ensures user has STUDENT role
 *
 * Responses:
 * - 200 OK: The total and per-status counts for the student
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a STUDENT
 * - 500 Internal Server Error: Unexpected error
 *
 * Note: this route must stay registered before any dynamic `/:id` route, so
 * that "stats" is never interpreted as a submission identifier.
 */
router.get(
  "/me/stats",
  authenticate,
  authorize("STUDENT"),
  getMySubmissionStatsController
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
 * - projectId: exact catalog code, e.g. "ph-01"
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
 * PUT /api/submissions/:id/resubmit
 *
 * Replaces the deliverable of a rejected submission. The existing row is
 * reused: the attempt counter goes up, the row returns to PENDING and the
 * previous review is kept so the student can still read it.
 *
 * Middleware chain:
 * 1. authenticate - Verifies JWT token from cookie
 * 2. authorize("STUDENT") - Ensures user has STUDENT role
 * 3. submissionRateLimiter - 20 requests per 10 minutes per user
 * 4. validate(submissionIdParamSchema, "params") - Validates the submission id
 * 5. validate(resubmitSchema, "body") - Validates the deliverable
 *
 * The project is not part of the body: a resubmission always stays on the
 * project the submission was made for.
 *
 * Responses:
 * - 200 OK: The updated submission
 * - 400 Bad Request: Invalid submission id or body
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a STUDENT
 * - 404 Not Found: No submission with that id, or it belongs to another student
 * - 409 Conflict: The submission is not in a resubmittable state
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: Unexpected error
 */
router.put(
  "/:id/resubmit",
  authenticate,
  authorize("STUDENT"),
  submissionRateLimiter,
  validate(submissionIdParamSchema, "params"),
  validate(resubmitSchema, "body"),
  resubmitSubmissionController
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
