import express from "express";

import { validate } from "../../middleware/validate.middleware";
import { authenticate, authorize } from "../auth/auth.middleware";
import { submissionRateLimiter } from "./submissionRateLimiter.middleware";
import { submissionSchema } from "./submission.validations";
import { createSubmissionController, getMySubmissionController } from "./submission.controller";

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
 * - 200 OK: Submission retrieved (may be null if no submission exists)
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: User is not a STUDENT
 * - 500 Internal Server Error: Unexpected error
 */
router.get(
  "/me",
  authenticate,
  authorize("STUDENT"),
  getMySubmissionController
);

export default router;