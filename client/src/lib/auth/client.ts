import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:5000",
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "enum",
          required: false, // Server sets default value (STUDENT), client doesn't send it
          options: ["STUDENT", "MENTOR"],
        },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
export type Session = typeof authClient.$Infer.Session;