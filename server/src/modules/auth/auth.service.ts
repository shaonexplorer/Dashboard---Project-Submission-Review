import { UserRole } from "../../generated/prisma/client";
import { compare, hash } from "bcryptjs";
import { prisma } from "../../config/prisma";
import { signToken } from "../../utils/jwt";
import { ApiError } from "../../utils/api-error";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Returns user data safe for API responses — never includes the password hash.
 */
export const getSafeUser = (user: {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export interface AuthTokens {
  user: ReturnType<typeof getSafeUser>;
  token: string;
}

/**
 * Registers a new user during public signup.
 *
 * Rules:
 * - Email is normalized before persistence.
 * - Duplicate email registration is rejected.
 * - Password is hashed before storage.
 * - Account role is forced to STUDENT; the client cannot choose it.
 */
export const signupService = async (data: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthTokens> => {
  const email = normalizeEmail(data.email);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, "Email already registered");
  }

  const passwordHash = await hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      email,
      passwordHash,
      role: UserRole.STUDENT,
    },
  });

  const token = signToken({ userId: user.id, role: user.role });

  return { user: getSafeUser(user), token };
};

/**
 * Authenticates an existing user (supports STUDENT and MENTOR).
 *
 * Does not reveal whether the email or the password caused the failure.
 */
export const loginService = async (data: {
  email: string;
  password: string;
}): Promise<AuthTokens> => {
  const email = normalizeEmail(data.email);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signToken({ userId: user.id, role: user.role });

  return { user: getSafeUser(user), token };
};
