import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Stricter rate limiter for authentication endpoints.
 *
 * Mitigates:
 * - Brute-force login attempts
 * - Credential stuffing
 * - Automated signup abuse
 *
 * Configuration:
 * - 10 requests per 15 minutes per IP
 * - Returns 429 Too Many Requests when exceeded
 * - Standard rate-limit headers
 *
 * This limiter is keyed by IP address since authentication requests
 * don't have an authenticated session yet.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again in a few minutes.",
    });
  },
});