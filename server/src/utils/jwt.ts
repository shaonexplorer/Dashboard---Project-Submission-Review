import { sign, verify, type SignOptions } from "jsonwebtoken";
import { ApiError } from "./api-error";
import { env } from "../config/env";

/**
 * Identity information carried inside the JWT payload. Kept to the minimum
 * needed by middleware to identify an authenticated user.
 */
export type TokenPayload = {
  userId: string;
  role: string;
};

/**
 * Signs a new JWT access token containing the given user identity.
 * Expiration comes from the configured JWT_EXPIRES_IN environment variable.
 */
export const signToken = (payload: TokenPayload): string => {
  return sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

/**
 * Verifies a JWT access token and returns its decoded payload.
 * Throws a 401 ApiError for missing, invalid, or expired tokens.
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = verify(token, env.JWT_SECRET);
    if (typeof decoded === "string" || decoded === null) {
      throw new ApiError(401, "Invalid token");
    }
    return decoded as TokenPayload;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(401, "Invalid or expired token");
  }
};
