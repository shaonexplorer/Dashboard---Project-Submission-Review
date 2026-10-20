import { UserRole } from "@prisma/client";

/**
 * Extends the Express Request interface so the authenticated user identity
 * attached by the authentication middleware is available without `any`.
 */
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole };
    }
  }
}

export {};
