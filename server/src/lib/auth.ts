import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import "dotenv/config";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  // baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CLIENT_URL.split(",").map((origin) => origin.trim()),

  advanced: {
    trustedProxyHeaders: true,
    useSecureCookies: env.NODE_ENV === "production", // Secure flag only in production (HTTPS)
    defaultCookieAttributes: {
      sameSite: env.NODE_ENV === "production" ? "none" : "lax", // none requires secure
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
      // domain:
      //   env.NODE_ENV === "production"
      //     ? process.env.COOKIE_DOMAIN
      //     : " localhost",
    },
    // If backend and frontend share a parent domain, use this instead:
    // crossSubDomainCookies: {
    //   enabled: true,
    //   domain: process.env.COOKIE_DOMAIN,
    // },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can enable later
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "STUDENT",
        input: false, // Don't allow client to set role
      },
    },
  },
});

export type Auth = typeof auth;
