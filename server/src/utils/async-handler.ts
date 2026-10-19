import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/**
 * Wraps an async route handler so thrown/rejected errors are forwarded to
 * Express's error-handling middleware via `next(err)`, removing the need for
 * local try/catch blocks in every controller.
 */
export const asyncHandler = (handler: AsyncRouteHandler): AsyncRouteHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
