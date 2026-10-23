import { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Submission-specific rate limiter using express-rate-limit.
 *
 * Configuration:
 * - 5 requests per 15 minutes per authenticated user
 * - Returns 429 Too Many Requests when exceeded
 * - Standard rate-limit headers
 *
 * The budget is keyed on the authenticated user id, not on the IP address.
 * A cohort frequently shares one public address — a classroom, a campus NAT —
 * and a per-IP window would let the first student to submit exhaust a budget
 * that every other student shares, so students who have done nothing wrong
 * would start seeing `429`. The IP is only used as a fallback for requests
 * that reach the limiter without an authenticated user.
 */
export const submissionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? `ip:${ipKeyGenerator(req.ip ?? "unknown")}`,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many submission attempts. Please try again later.",
    });
  },
});