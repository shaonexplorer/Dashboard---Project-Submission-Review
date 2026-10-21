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
 * - 20 requests per 10 minutes per authenticated user
 * - Returns 429 Too Many Requests when exceeded
 * - Uses the application's standard API error format
 *
 * The budget is keyed on the authenticated user id, not on the IP address.
 * A cohort frequently shares one public address — a classroom, a campus NAT —
 * and a per-IP window would let the first student to submit exhaust a budget
 * that every other student shares, so students who have done nothing wrong
 * would start seeing `429`. The IP is only used as a fallback for requests
 * that reach the limiter without an authenticated user.
 *
 * The window is 10 minutes and the budget is 20 requests, which is enough for
 * a student to hand in every project in the catalog and still resubmit the
 * ones that came back rejected.
 */
export const submissionRateLimiter = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const key = req.user?.id ?? req.ip ?? "unknown";
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const max = 20;

  const entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    // First request or window expired
    store.set(key, { count: 1, resetTime: now + windowMs });
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
