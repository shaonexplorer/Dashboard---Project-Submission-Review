/**
 * Server-side API utilities for Server Components.
 *
 * These functions run on the server (in async Server Components) and fetch data
 * directly from the Express backend using the auth token from cookies.
 * They are designed to be used in Server Components for initial data loading (SSR/ISR).
 */
import { cookies } from "next/headers";

// Types re-exported from client API for consistency
import type {
  Submission,
  SubmissionStatus,
  StudentSubmissionListQuery,
  StudentProjectRow,
  PaginatedSubmissionsResponse,
  StudentSubmissionStats,
  CreateSubmissionPayload,
  ResubmitSubmissionPayload,
  SubmissionErrorCode,
  SUBMISSION_ERROR_CODES,
} from "@/lib/api/submissions";

import type { Project } from "@/lib/api/projects";

export type {
  Submission,
  SubmissionStatus,
  StudentSubmissionListQuery,
  StudentProjectRow,
  PaginatedSubmissionsResponse,
  StudentSubmissionStats,
  CreateSubmissionPayload,
  ResubmitSubmissionPayload,
  SubmissionErrorCode,
  SUBMISSION_ERROR_CODES,
};

export type { Project };

import type {
  MentorSubmission,
  PaginationMeta,
  SubmissionStats,
  SubmissionSortField,
  SubmissionSortOrder,
  SubmissionListQuery,
  ReviewDecision,
  ReviewSubmissionPayload,
} from "@/lib/api/mentor-submissions";

export type {
  MentorSubmission,
  PaginationMeta,
  SubmissionStats,
  SubmissionSortField,
  SubmissionSortOrder,
  SubmissionListQuery,
  ReviewDecision,
  ReviewSubmissionPayload,
};

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "MENTOR";
  image?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  code?: string;
}

class ServerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Array<{ field: string; message: string }> = [],
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

/**
 * Build the Cookie header for server-side fetches to the Express backend.
 *
 * The backend uses BetterAuth, which sets its session cookie as
 * `__Secure-better-auth.session_token` (not a cookie named `token`). We
 * extract that specific cookie and forward it with its proper name so
 * `auth.api.getSession({ headers })` in the backend can resolve the session.
 * Forwarding `token=<value>` would not authenticate — BetterAuth looks for its
 * own cookie name, not `token`.
 */
async function getAuthCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  // Maps all cookies into a standard "name=value; name2=value2" format
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

/**
 * Core server-side fetch with auth.
 * Uses the token cookie to authenticate with the Express backend.
 */
// Next.js fetch options type that includes cache, revalidate, and tags
type NextFetchOptions = {
  cache?: RequestCache;
  revalidate?: number | false;
  tags?: string[];
};

/**
 * Absolute base URL of the Express backend API, for server-side fetches.
 *
 * Node's `fetch` requires an absolute URL, so the client-relative `/api`
 * returned by `getApiUrl()` cannot be used here — that works in the browser
 * because Next.js rewrites `/api/*` to the backend (and the `token` cookie is
 * same-origin). Server Components call the backend directly, so build the
 * absolute URL from the same env var the rewrites use, accepting both the
 * `http://localhost:5000` and `http://localhost:5000/api` shapes.
 */
function getServerApiUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
  ).replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

async function serverFetch<T>(
  path: string,
  init: RequestInit = {},
  nextOptions?: NextFetchOptions,
): Promise<T> {
  const cookieHeader = await getAuthCookieHeader();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  // const response = await fetch(`${getServerApiUrl()}${path}`, {
  //   ...init,
  //   headers,
  //   credentials: "include", // Include cookies for cross-domain if needed
  //   next: nextOptions,
  // });

  const response = await fetch(`${getServerApiUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include", // Include cookies for cross-domain if needed
    next: nextOptions,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response
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
          (e): e is { field: string; message: string } =>
            typeof e === "object" &&
            e !== null &&
            typeof (e as { field: string; message: string }).field ===
              "string" &&
            typeof (e as { field: string; message: string }).message ===
              "string",
        )
      : [];
    const code =
      typeof body.code === "string" && body.code.length > 0
        ? body.code
        : undefined;

    throw new ServerApiError(response.status, message, fieldErrors, code);
  }

  return payload as T;
}

/**
 * Build query string from object, omitting undefined values.
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

/**
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 */

/**
 * Get current user session from the Next.js API route.
 * This uses the internal `/api/auth/me` which forwards the cookie to backend.
 */
export async function getCurrentUserServer(nextOptions?: {
  cache?: RequestCache;
  revalidate?: number | false;
  tags?: string[];
}): Promise<User | null> {
  try {
    const cookieHeader = await getAuthCookieHeader();
    if (!cookieHeader) return null;

    const headers = new Headers({ "Content-Type": "application/json" });
    headers.set("Cookie", cookieHeader);

    // Call BetterAuth's session endpoint on the backend directly, forwarding
    // the session cookie so the backend can resolve the session.
    const response = await fetch(`${getServerApiUrl()}/auth/get-session`, {
      headers,
      credentials: "include",
      next: nextOptions,
    });

    // console.log({ response });

    if (!response.ok) {
      if (response.status === 401) return null;
      throw new Error("Failed to fetch user");
    }

    // BetterAuth returns { session, user } directly, though some deployments
    // wrap it in { data: { session, user } }. Handle both shapes.
    const raw = (await response.json()) as {
      session?: unknown;
      user?: BetterAuthUser;
      data?: { session?: unknown; user?: BetterAuthUser };
    };

    const userData = raw.user ?? raw.data?.user;
    if (!userData) return null;

    // Transform BetterAuth user to our User type
    return {
      id: userData.id,
      name: userData.name ?? null,
      email: userData.email,
      role: (userData.role === "MENTOR" ? "MENTOR" : "STUDENT") as
        | "STUDENT"
        | "MENTOR",
      image: userData.image ?? null,
    };
  } catch {
    return null;
  }
}

/** Shape of the user returned by BetterAuth /api/auth/session */
interface BetterAuthUser {
  id: string;
  name: string | null;
  email: string;
  role?: string;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ============================================================
 * STUDENT SUBMISSIONS
 * ============================================================
 */

/**
 * Fetch all submissions for the authenticated student.
 * Uses a large limit to get all in one request.
 */
export async function getMySubmissionsServer(
  nextOptions: NextFetchOptions = { cache: "no-store" },
): Promise<Submission[]> {
  const response = await serverFetch<
    ApiResponse<{ submissions: Submission[] }>
  >(`/submissions/me?limit=100`, { method: "GET" }, nextOptions);
  return response.data?.submissions ?? [];
}

/**
 * Fetch paginated submissions for the authenticated student.
 */
export async function getMySubmissionsPaginatedServer(
  query: StudentSubmissionListQuery,
  nextOptions: NextFetchOptions = { cache: "no-store" },
): Promise<PaginatedSubmissionsResponse> {
  const queryString = buildQueryString(
    query as unknown as Record<string, unknown>,
  );
  const response = await serverFetch<ApiResponse<PaginatedSubmissionsResponse>>(
    `/submissions/me?${queryString}`,
    { method: "GET" },
    nextOptions,
  );
  return (
    response.data ?? {
      submissions: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }
  );
}

/**
 * Fetch submission statistics for the authenticated student.
 */
export async function getMySubmissionStatsServer(
  nextOptions: NextFetchOptions = { cache: "no-store" },
): Promise<StudentSubmissionStats> {
  const response = await serverFetch<ApiResponse<StudentSubmissionStats>>(
    `/submissions/me/stats`,
    { method: "GET" },
    nextOptions,
  );
  return (
    response.data ?? {
      total: 0,
      pending: 0,
      active: 0,
      approved: 0,
      rejected: 0,
      archived: 0,
    }
  );
}

/**
 * Fetch a single submission by ID.
 */
export async function getSubmissionByIdServer(
  submissionId: string,
  nextOptions: NextFetchOptions = { cache: "no-store" },
): Promise<Submission | null> {
  const submissions = await getMySubmissionsServer(nextOptions);
  return submissions.find((s) => s.id === submissionId) ?? null;
}

/**
 * Fetch the project catalog.
 */
export async function getProjectsServer(
  nextOptions: NextFetchOptions = { revalidate: 3600 },
): Promise<Project[]> {
  const response = await serverFetch<ApiResponse<{ projects: Project[] }>>(
    `/projects`,
    { method: "GET" },
    nextOptions,
  );
  return response.data?.projects ?? [];
}

/**
 * ============================================================
 * MENTOR SUBMISSIONS
 * ============================================================
 */

/**
 * Fetch paginated submissions for mentor dashboard.
 */
export async function getMentorSubmissionsServer(
  query: SubmissionListQuery,
  nextOptions: NextFetchOptions = { cache: "no-store" },
): Promise<{ submissions: MentorSubmission[]; pagination: PaginationMeta }> {
  const queryString = buildQueryString(
    query as unknown as Record<string, unknown>,
  );
  const response = await serverFetch<
    ApiResponse<{ submissions: MentorSubmission[]; pagination: PaginationMeta }>
  >(`/submissions?${queryString}`, { method: "GET" }, nextOptions);
  return (
    response.data ?? {
      submissions: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }
  );
}

/**
 * Fetch mentor submission statistics.
 */
export async function getSubmissionStatsServer(
  nextOptions: NextFetchOptions = { cache: "no-store" },
): Promise<SubmissionStats> {
  const response = await serverFetch<ApiResponse<SubmissionStats>>(
    `/submissions/stats`,
    { method: "GET" },
    nextOptions,
  );
  return response.data ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
}

/**
 * ============================================================
 * MUTATIONS (for Server Actions)
 * ============================================================
 */

/**
 * Create a new submission.
 * Used in Server Actions.
 */
export async function createSubmissionServer(
  payload: CreateSubmissionPayload,
): Promise<Submission> {
  const response = await serverFetch<ApiResponse<{ submission: Submission }>>(
    `/submissions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { cache: "no-store" },
  );

  if (!response.data?.submission) {
    throw new ServerApiError(
      500,
      "The server did not return the created submission.",
    );
  }
  return response.data.submission;
}

/**
 * Resubmit a rejected submission.
 * Used in Server Actions.
 */
export async function resubmitSubmissionServer(
  submissionId: string,
  payload: ResubmitSubmissionPayload,
): Promise<Submission> {
  const response = await serverFetch<ApiResponse<{ submission: Submission }>>(
    `/submissions/${submissionId}/resubmit`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    { cache: "no-store" },
  );

  if (!response.data?.submission) {
    throw new ServerApiError(
      500,
      "The server did not return the resubmitted submission.",
    );
  }
  return response.data.submission;
}

/**
 * Update submission status (mentor review).
 * Used in Server Actions.
 */
export async function updateSubmissionStatusServer(
  submissionId: string,
  payload: ReviewSubmissionPayload,
): Promise<MentorSubmission> {
  const response = await serverFetch<
    ApiResponse<{ submission: MentorSubmission }>
  >(
    `/submissions/${submissionId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { cache: "no-store" },
  );

  if (!response.data?.submission) {
    throw new ServerApiError(
      500,
      "The server did not return the updated submission.",
    );
  }
  return response.data.submission;
}

/**
 * Export error class for use in Server Actions
 */
export { ServerApiError };
