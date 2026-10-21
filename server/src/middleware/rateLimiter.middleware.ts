import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/api-error";

/**
 * The global rate limiter.
 *
 * Every API request passes through it, so a single client cannot flood the
 * server with reads. The submission endpoints carry their own, much tighter
 * limiter on top of this one — that one counts *attempts*, this one counts
 * *traffic*.
 *
 * Configuration:
 * - 100 requests per 15 minutes
 * - Returns 429 Too Many Requests when exceeded
 * - Uses the application's standard API error format
 *
 * The budget is keyed on the session rather than on the IP address. A cohort
 * regularly shares one public address — a classroom, a campus NAT — and a
 * per-IP window would let the first student to browse exhaust a budget that
 * every other student shares, so students who have done nothing wrong would
 * start seeing `429`. An authenticated request is identified by its session
 * cookie; an anonymous one falls back to the IP address, because that is the
 * only handle it has.
 *
 * The cookie is hashed before it becomes a key, so no session material is
 * kept in memory.
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Cleanup of expired entries, so the store does not grow without bound.
 * Runs every 5 minutes.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/** Length of the rate-limiting window. */
export const GLOBAL_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/** Number of requests allowed inside one window. */
export const GLOBAL_RATE_LIMIT_MAX_REQUESTS = 100;

/**
 * The bucket a request counts against.
 *
 * An authenticated request is identified by its session cookie, which is
 * stable for the lifetime of the login and unique per session. The token is
 * hashed, so the store never holds a credential.
 */
function resolveRateLimitKey(req: Request): string {
  const token = req.cookies?.token;

  if (typeof token === "string" && token.length > 0) {
    const fingerprint = createHash("sha256").update(token).digest("hex");
    return `session:${fingerprint.slice(0, 32)}`;
  }

  return `ip:${req.ip ?? "unknown"}`;
}

export const globalRateLimiter = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const key = resolveRateLimitKey(req);
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    // First request in this window.
    store.set(key, { count: 1, resetTime: now + GLOBAL_RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= GLOBAL_RATE_LIMIT_MAX_REQUESTS) {
    return next(
      new ApiError(429, "Too many requests. Please try again in a few minutes.")
    );
  }

  entry.count += 1;
  next();
};
