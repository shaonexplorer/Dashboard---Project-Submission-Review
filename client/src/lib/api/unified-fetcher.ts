import { ApiRequestError, ApiFieldError } from "./client";
import Cookies from "js-cookie";

/**
 * Unified fetcher that works in both Server Components and Client Components.
 *
 * - In Server Components: Uses `cookies()` from `next/headers` to forward the
 *   incoming request's cookies to the Express backend.
 * - In Client Components: Reads the `auth_token` cookie and sends it as
 *   `Authorization: Bearer <token>` header.
 *
 * This replaces both `fetcher` (client-only) and `fetchFromApi` (server-only).
 */
export async function unifiedFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  // Ensure the path starts with a leading slash
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Ensure the path includes /api prefix for rewrites
  const endpoint = cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`;

  const { headers, ...rest } = init;

  // Build headers - Content-Type is set automatically for JSON bodies
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  // In Server Components, we can forward cookies from the incoming request
  // In Client Components, we read the auth_token cookie and send as Bearer token
  let cookieString: string | undefined;

  try {
    // This only works in Server Components (Next.js 15+)
    // In Client Components, this will be undefined
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieString = cookieStore.toString();
  } catch {
    // Not in a Server Component context - cookies() not available
    // Client Components will use the auth_token cookie for Authorization header
  }

  // In Client Components (or when no server cookies), use the auth_token cookie
  // for Authorization header. The auth_token cookie is set on the Next.js domain
  // by the authClient's onSuccess handler.
  if (!cookieString) {
    const authToken = Cookies.get("auth_token");
    if (authToken) {
      requestHeaders.Authorization = `Bearer ${authToken}`;
    }
  }

  if (cookieString) {
    requestHeaders.Cookie = cookieString;
  }

  const response = await fetch(endpoint, {
    ...rest,
    credentials: "include",
    headers: requestHeaders,
    // Prevent caching in Server Components
    ...(cookieString ? { cache: "no-store" as const } : {}),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response body
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
          (err): err is ApiFieldError =>
            typeof err === "object" &&
            err !== null &&
            typeof (err as ApiFieldError).field === "string" &&
            typeof (err as ApiFieldError).message === "string"
        )
      : [];

    const code =
      typeof body.code === "string" && body.code.length > 0
        ? body.code
        : undefined;

    throw new ApiRequestError(response.status, message, fieldErrors, code);
  }

  return payload as T;
}

/**
 * Re-export the fetcher as the default for backward compatibility.
 * Client Components should use this directly.
 * Server Components should use `unifiedFetch` (which this re-exports).
 */
export const fetcher = unifiedFetch;