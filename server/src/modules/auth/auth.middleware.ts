import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../../utils/api-error";
import { verifyToken } from "../../utils/jwt";

/**
 * Authentication middleware (cookie-based).
 *
 * Reads the JWT access token from the `token` cookie instead of a
 * `Authorization: Bearer` header, verifies it, and attaches the
 * authenticated user identity to `req.user`. Rejects missing,
 * invalid, or expired tokens with 401 Unauthorized.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.token;

  if (!token) {
    return next(new ApiError(401, "Missing authentication token"));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

/**
 * Role-based authorization middleware.
 * Usage: authorize("STUDENT") or authorize("MENTOR", "ADMIN")
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden: insufficient role"));
    }

    next();
  };
};
