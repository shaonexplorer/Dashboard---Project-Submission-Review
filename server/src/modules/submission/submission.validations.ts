import { z } from "zod";

/**
 * Input validation schema for project submission.
 *
 * All four fields are required and must be valid URLs where applicable.
 * Strings are trimmed to reject whitespace-only input.
 */
export const submissionSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(150, "Project name must be at most 150 characters"),
  repoUrl: z
    .string()
    .trim()
    .min(1, "Repository URL is required")
    .url("Repository URL must be a valid URL")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Repository URL must use HTTP or HTTPS protocol" }
    )
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.hostname === "github.com" || parsed.hostname === "www.github.com";
        } catch {
          return false;
        }
      },
      { message: "Repository URL must be a GitHub URL (github.com)" }
    ),
  liveUrl: z
    .string()
    .trim()
    .min(1, "Live URL is required")
    .url("Live URL must be a valid URL")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Live URL must use HTTP or HTTPS protocol" }
    ),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(5000, "Description must be at most 5000 characters"),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

/**
 * Statuses a mentor can filter the submission list by.
 *
 * Mirrors the Prisma `SubmissionStatus` enum.
 */
export const SUBMISSION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

/**
 * Fields the mentor submission table may be sorted by.
 *
 * This whitelist is the only way a client-supplied `sortBy` reaches Prisma —
 * a value outside it is rejected by the query schema, never forwarded to the
 * database.
 */
export const SUBMISSION_SORT_FIELDS = ["createdAt", "projectName", "status"] as const;

/** Supported sort directions. */
export const SORT_ORDERS = ["asc", "desc"] as const;

/** Number of submissions returned per page when the client does not say. */
export const DEFAULT_SUBMISSION_LIST_LIMIT = 10;

/**
 * Hard ceiling on the page size.
 *
 * A client may ask for fewer rows than the default but never more than this,
 * so a single request cannot pull the whole table into memory.
 */
export const MAX_SUBMISSION_LIST_LIMIT = 100;

/** Longest search term accepted before the query is rejected. */
export const MAX_SUBMISSION_SEARCH_LENGTH = 200;

/**
 * Query schema for the mentor submission list.
 *
 * Every value arrives as a string, so `page` and `limit` are coerced to
 * numbers and then range-checked. The defaults match the documented
 * contract: page 1, 10 rows, newest first.
 */
export const submissionListQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: "Page must be a number" })
    .int("Page must be a whole number")
    .positive("Page must be greater than 0")
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: "Limit must be a number" })
    .int("Limit must be a whole number")
    .positive("Limit must be greater than 0")
    .max(MAX_SUBMISSION_LIST_LIMIT, `Limit must be at most ${MAX_SUBMISSION_LIST_LIMIT}`)
    .default(DEFAULT_SUBMISSION_LIST_LIMIT),
  status: z.enum(SUBMISSION_STATUSES).optional(),
  search: z
    .string()
    .trim()
    .max(MAX_SUBMISSION_SEARCH_LENGTH, `Search term must be at most ${MAX_SUBMISSION_SEARCH_LENGTH} characters`)
    .optional(),
  sortBy: z.enum(SUBMISSION_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(SORT_ORDERS).default("desc"),
});

/**
 * The normalized list query.
 *
 * This is the single shape the controller passes to the service, so raw query
 * strings are parsed exactly once — in the validation middleware.
 */
export type SubmissionListQuery = z.infer<typeof submissionListQuerySchema>;

/**
 * Review decisions a mentor may record.
 *
 * `PENDING` is deliberately excluded: it is the state a submission starts in,
 * not a decision a mentor makes. Moving a submission back into the queue is
 * not part of the review workflow.
 */
export const REVIEW_DECISIONS = ["APPROVED", "REJECTED"] as const;

/** Longest feedback a mentor can attach to a review. */
export const MAX_REVIEW_FEEDBACK_LENGTH = 2000;

/**
 * Body schema for a mentor review decision.
 *
 * The status is restricted to the decisions above, so a client can never push
 * an arbitrary string into the `status` column.
 */
export const submissionStatusUpdateSchema = z.object({
  status: z.enum(REVIEW_DECISIONS, {
    errorMap: () => ({ message: "Status must be APPROVED or REJECTED" }),
  }),
  feedback: z
    .string()
    .trim()
    .max(
      MAX_REVIEW_FEEDBACK_LENGTH,
      `Feedback must be at most ${MAX_REVIEW_FEEDBACK_LENGTH} characters`
    )
    .optional(),
});

/**
 * The normalized review payload.
 */
export type SubmissionStatusUpdateInput = z.infer<typeof submissionStatusUpdateSchema>;

/**
 * Params schema for the review route.
 *
 * The identifier is checked before it reaches the service, so a malformed id
 * is rejected as a bad request instead of being forwarded to the database.
 */
export const submissionIdParamSchema = z.object({
  id: z.string().uuid("Submission id must be a valid identifier"),
});

/**
 * The normalized review route params.
 */
export type SubmissionIdParams = z.infer<typeof submissionIdParamSchema>;