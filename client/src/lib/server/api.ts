import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/utils";

/**
 * Server-side fetcher for Next.js Server Components and Server Actions.
 *
 * Forwards the user's session cookie from the incoming Next.js request
 * to the Express backend API. This enables authenticated server-side
 * data fetching (e.g., in Server Components, generateMetadata, etc.).
 *
 * @param path - API endpoint path (e.g., "/submissions/me")
 * @param init - Standard fetch RequestInit options
 * @returns Parsed JSON response
 *
 * @example
 * ```ts
 * // In a Server Component
 * const submissions = await fetchFromApi("/submissions/me");
 * ```
 */
export async function fetchFromApi<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  // Get cookies from the incoming request (Next.js Server Component context)
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
      // Forward the client's cookie to the Express backend
      Cookie: cookieString,
    },
    // Prevent Next.js from caching authenticated responses
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response body (e.g., HTML error page)
  }

  if (!response.ok) {
    const body = (payload ?? {}) as {
      message?: unknown;
      errors?: unknown;
      code?: unknown;
    };

    const message =
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message
        : `Request failed with status ${response.status}`;

    const fieldErrors = Array.isArray(body.errors)
      ? body.errors.filter(
          (err): err is { field: string; message: string } =>
            typeof err === "object" &&
            err !== null &&
            typeof (err as { field: string; message: string }).field ===
              "string" &&
            typeof (err as { field: string; message: string }).message ===
              "string"
        )
      : [];

    const code =
      typeof body.code === "string" && body.code.length > 0
        ? body.code
        : undefined;

    const error = new Error(message) as Error & {
      status: number;
      fieldErrors: { field: string; message: string }[];
      code?: string;
    };
    error.status = response.status;
    error.fieldErrors = fieldErrors;
    error.code = code;

    throw error;
  }

  return payload as T;
}