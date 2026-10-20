import { getApiUrl } from "@/lib/utils";

/** A single field-level validation problem reported by the API. */
export interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * Error thrown for any non-2xx API response.
 *
 * Carries the HTTP status so callers can react to specific failure modes
 * (401 session expiry, 409 duplicate submission, 429 rate limit, ...) instead
 * of pattern-matching on message text.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldError[];

  constructor(status: number, message: string, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;

    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

function isApiFieldError(value: unknown): value is ApiFieldError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ApiFieldError).field === "string" &&
    typeof (value as ApiFieldError).message === "string"
  );
}

/** Default message used when the API responds without a usable message. */
function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "The submitted data is invalid.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 409:
      return "This action conflicts with the current server state.";
    case 429:
      return "Too many requests. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/**
 * Performs an authenticated JSON request against the backend API.
 *
 * Authentication is cookie-based, so `credentials: "include"` is always sent.
 * Throws {@link ApiRequestError} for any non-2xx response.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = init;

  const response = await fetch(`${getApiUrl()}${path}`, {
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
    // A non-JSON body (e.g. an HTML error page) is handled by the status branch below.
  }

  if (!response.ok) {
    const body = (payload ?? {}) as { message?: unknown; errors?: unknown };
    const message =
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message
        : defaultMessageForStatus(response.status);
    const fieldErrors = Array.isArray(body.errors)
      ? body.errors.filter(isApiFieldError)
      : [];

    throw new ApiRequestError(response.status, message, fieldErrors);
  }

  return payload as T;
}
