import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  /**
   * Base URL for Better Auth API.
   * Points to the Express backend (e.g., http://localhost:5000).
   * The client will make requests to this URL and handle cookies automatically.
   */
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:5000",

  /**
   * Include credentials (cookies) in cross-origin requests.
   * Required when the auth API is on a different domain/subdomain than the client.
   * With Next.js rewrites, the browser sends cookies for the Next.js domain,
   * but Better Auth client may make direct requests to the Express backend.
   */
  fetchOptions: {
    credentials: "include",
  },

  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: false, // Server sets default value (STUDENT), client doesn't send it
          options: ["STUDENT", "MENTOR"],
        },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
export type Session = typeof authClient.$Infer.Session;
