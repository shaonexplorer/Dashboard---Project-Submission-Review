import { z } from "zod";

/**
 * Longest repository or live URL the API accepts.
 *
 * Mirrors `MAX_SUBMISSION_URL_LENGTH` in
 * `server/src/modules/submission/submission.validations.ts`.
 */
export const MAX_SUBMISSION_URL_LENGTH = 150;

/**
 * Client-side submission schema.
 *
 * This mirrors `server/src/modules/submission/submission.validations.ts` exactly
 * (same Zod version, same rules, same messages) so the browser never accepts
 * data the API would reject, and never rejects data the API would accept.
 *
 * The backend remains authoritative — this schema exists for fast UX feedback.
 */
export const submissionSchema = z.object({
  /**
   * The catalog code of the project being submitted.
   *
   * The project is no longer typed in by hand: the student picks an entry
   * from the catalog and the server writes the display name itself.
   */
  projectId: z
    .string()
    .trim()
    .min(1, "Project is required")
    .max(50, "Project code must be at most 50 characters"),
  repoUrl: z
    .string()
    .trim()
    .min(1, "Repository URL is required")
    .max(
      MAX_SUBMISSION_URL_LENGTH,
      `Repository URL must be at most ${MAX_SUBMISSION_URL_LENGTH} characters`
    )
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
    .max(
      MAX_SUBMISSION_URL_LENGTH,
      `Live URL must be at most ${MAX_SUBMISSION_URL_LENGTH} characters`
    )
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

export type SubmissionFormValues = z.infer<typeof submissionSchema>;

/**
 * Client-side resubmission schema.
 *
 * The same three deliverable rules as the create form, without the project:
 * a resubmission always stays on the project the submission was made for.
 */
export const resubmitSchema = z.object({
  repoUrl: submissionSchema.shape.repoUrl,
  liveUrl: submissionSchema.shape.liveUrl,
  description: submissionSchema.shape.description,
});

export type ResubmitFormValues = z.infer<typeof resubmitSchema>;

/** Maximum length of the project code, used for the field hint. */
export const PROJECT_ID_MAX_LENGTH = 50;

/** Maximum length of the description, used for the character counter. */
export const DESCRIPTION_MAX_LENGTH = 5000;
