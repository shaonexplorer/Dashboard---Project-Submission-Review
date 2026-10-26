import { ApiRequestError, ApiFieldError } from "./client";

/**
 * Reusable client-side fetcher utility for relative path requests.
 * Automatically prefixes requests with `/api` via Next.js rewrites
 * and ensures `credentials: "include"` is sent for cookie-based authentication.
 */
export async function fetcher<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  // Ensure the path starts with a leading slash and properly formats relative endpoints
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // If the path already includes /api, keep it, otherwise prefix it.
  // Since rewrites expect /api/:path*, requesting /api/foo is correctly proxied.
  const endpoint = cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`;

  const { headers, ...rest } = init;

  const response = await fetch(endpoint, {
    credentials: "include",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers as Record<string, string> | undefined),
    },
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response bodies
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
      ? (body.errors.filter((err): err is ApiFieldError =>
          typeof err === "object" && err !== null && typeof (err as ApiFieldError).field === "string" && typeof (err as ApiFieldError).message === "string"
        ))
      : [];

    const code =
      typeof body.code === "string" && body.code.length > 0 ? body.code : undefined;

    throw new ApiRequestError(response.status, message, fieldErrors, code);
  }

  return payload as T;
}
