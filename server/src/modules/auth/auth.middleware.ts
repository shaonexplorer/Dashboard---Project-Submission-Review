import type { NextFunction, Request, Response } from "express";
import { auth } from "../../lib/auth";
import { ApiError } from "../../utils/api-error";

/**
 * Authentication middleware using BetterAuth session verification.
 *
 * Verifies the session from cookies/headers and attaches the authenticated
 * user identity to `req.user`. Rejects missing, invalid, or expired sessions
 * with 401 Unauthorized.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return next(new ApiError(401, "Missing authentication token"));
    }

    // The role is stored as an additional field on the user
    const userRole = (session.user as { role?: string }).role ?? "STUDENT";

    req.user = {
      id: session.user.id,
      role: userRole as "STUDENT" | "MENTOR",
    };
    next();
  } catch {
    return next(new ApiError(401, "Invalid or expired session"));
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
