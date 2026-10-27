import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import Cookies from "js-cookie";

/**
 * Better Auth client configured for bearer token flow.
 *
 * - On sign-in/sign-up, the server returns a `set-auth-token` header with the session token.
 * - We capture this token and store it in a cookie on the Next.js domain.
 * - On every subsequent request, we read the cookie and send it as `Authorization: Bearer <token>`.
 */
export const authClient = createAuthClient({
  /**
   * Base URL for Better Auth API.
   * Points to the Express backend (e.g., http://localhost:5000).
   */
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:5000",

  /**
   * Custom fetch options to handle the bearer token flow.
   */
  fetchOptions: {
    /**
     * Called after every successful auth call (signIn, signUp, etc.).
     * The server returns the session token in the `set-auth-token` response header.
     * We extract it and store it in a cookie on the client (Next.js) domain.
     */
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) {
        Cookies.set("auth_token", token, {
          expires: 7, // 7 days
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          // No domain option: defaults to current (client) domain
        });
      }
    },

    /**
     * Send the stored token as Authorization: Bearer header on every auth-client call.
     * This enables the bearer plugin on the server to authenticate the request.
     */
    auth: {
      type: "Bearer",
      token: () => Cookies.get("auth_token") || "",
    },
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

/**
 * Wrapper around authClient.signOut that also clears the auth_token cookie.
 * This ensures the token is removed from the client domain on sign out.
 */
export async function signOutWithCookieClear() {
  await authClient.signOut();
  Cookies.remove("auth_token", { path: "/" });
}

export const { signIn, signUp, useSession, getSession } = authClient;
export type Session = typeof authClient.$Infer.Session;
