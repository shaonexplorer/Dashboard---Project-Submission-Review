import { z } from "zod";

/**
 * The catalog code of a project.
 *
 * A project id is a readable code chosen when the catalog is defined ("ph-01"),
 * never a generated UUID. The rule is shared by the create body, the resubmit
 * body and the mentor list filter, so the three can never drift apart.
 */
export const projectIdSchema = z
  .string()
  .trim()
  .min(1, "Project is required")
  .max(50, "Project code must be at most 50 characters");

/**
 * Query schema for the catalog listing.
 *
 * The endpoint is a plain read of the whole active catalog, so it takes no
 * parameters. The schema exists so the route can state that explicitly rather
 * than accepting — and silently ignoring — anything a client sends.
 */
export const projectListQuerySchema = z.object({}).passthrough();
