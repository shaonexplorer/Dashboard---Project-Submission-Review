import { ZodSchema } from "zod";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";

type Source = "body" | "query" | "params";

/**
 * Schema-based request validation middleware (Zod).
 *
 * Validates the given source (body, query or params) against a Zod schema.
 * On failure it forwards a 400 ApiError to the global error middleware with
 * the validation issues attached. On success the validated data replaces
 * `req[source]` so controllers receive typed input.
 */
export const validate =
  (schema: ZodSchema, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new ApiError(400, "Validation failed", issues));
    }

    (req as Record<Source, unknown>)[source] = result.data;
    next();
  };
