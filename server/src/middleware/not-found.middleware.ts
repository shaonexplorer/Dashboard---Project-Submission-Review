import { ApiError } from "../utils/api-error";
import type { NextFunction, Request, Response } from "express";

/**
 * Handles unmatched routes by forwarding a 404 ApiError to the global error
 * middleware, so missing resources produce the standard error response.
 */
export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, "Resource not found"));
};
