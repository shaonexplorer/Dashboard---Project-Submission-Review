import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "../config/prisma";
import { env } from "../config/env";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CLIENT_URL.split(",").map((origin) => origin.trim()),

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
        type: "enum",
        required: true,
        defaultValue: "STUDENT",
        input: false, // Don't allow client to set role
        options: ["STUDENT", "MENTOR"],
      },
    },
  },
});

export type Auth = typeof auth;