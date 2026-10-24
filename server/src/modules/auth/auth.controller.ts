import type { Request, Response, CookieOptions } from "express";

import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/api-response";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/api-error";
import { signupService, loginService, getSafeUser } from "./auth.service";

/**
 * Cookie options for the JWT access token.
 * httpOnly prevents client-side JavaScript access (mitigates XSS theft).
 */
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

export const signupController = asyncHandler(
  async (req: Request, res: Response) => {
    const { user, token } = await signupService(
      req.body as {
        fullName: string;
        email: string;
        password: string;
      },
    );

    res.cookie("token", token, cookieOptions);

    sendResponse(res, 201, "Account created successfully", { user });
  },
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const { user, token } = await loginService(
      req.body as {
        email: string;
        password: string;
      },
    );

    res.cookie("token", token, cookieOptions);

    sendResponse(res, 200, "Login successful", { user, token });
  },
);

export const meController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    sendResponse(res, 200, "Authenticated user", { user: getSafeUser(user) });
  },
);
