import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/api-error";

/**
 * In-memory store for rate limiting.
 * In production, consider using Redis for distributed rate limiting.
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Cleanup old entries periodically to prevent memory leaks.
 * Runs every 5 minutes.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Submission-specific rate limiter (in-memory implementation).
 *
 * Configuration:
 * - 5 requests per 10 minutes per IP address
 * - Returns 429 Too Many Requests when exceeded
 * - Uses the application's standard API error format
 */
export const submissionRateLimiter = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const max = 5;

  const entry = store.get(ip);

  if (!entry || entry.resetTime < now) {
    // First request or window expired
    store.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (entry.count >= max) {
    // Rate limit exceeded
    return next(
      new ApiError(
        429,
        "Too many submission attempts. Please try again later."
      )
    );
  }

  // Increment count
  entry.count += 1;
  next();
};