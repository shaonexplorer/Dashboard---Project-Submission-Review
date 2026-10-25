import { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { createHash } from "node:crypto";

/**
 * The global rate limiter using express-rate-limit.
 *
 * Every API request passes through it, so a single client cannot flood the
 * server with reads. The submission endpoints carry their own, much tighter
 * limiter on top of this one — that one counts *attempts*, this one counts
 * *traffic*.
 *
 * Configuration:
 * - 100 requests per 2 minutes
 * - Returns 429 Too Many Requests when exceeded
 * - Uses the application's standard API error format
 * - Standard rate-limit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
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

/** Length of the rate-limiting window. */
export const GLOBAL_RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000;

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

  return `ip:${ipKeyGenerator(req.ip ?? "unknown")}`;
}

export const globalRateLimiter = rateLimit({
  windowMs: GLOBAL_RATE_LIMIT_WINDOW_MS,
  max: GLOBAL_RATE_LIMIT_MAX_REQUESTS,
  keyGenerator: resolveRateLimitKey,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again in a few minutes.",
    });
  },
});
