import { z } from "zod";

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

export type SubmissionFormValues = z.infer<typeof submissionSchema>;

/** Maximum length of the project name, used for the field hint. */
export const PROJECT_NAME_MAX_LENGTH = 150;

/** Maximum length of the description, used for the character counter. */
export const DESCRIPTION_MAX_LENGTH = 5000;
