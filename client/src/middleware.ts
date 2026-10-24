import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Backend API URL for verifying authentication
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Protected routes configuration
 */
const PROTECTED_ROUTES = {
  student: ["/student"],
  mentor: ["/mentor"],
} as const;

/**
 * Public routes that don't require authentication
 * These are exact paths or prefixes that should be accessible without auth
 */
const PUBLIC_ROUTES = ["/", "/auth", "/api", "/_next", "/favicon.ico"];

/**
 * Check if a path matches any of the given route prefixes
 */
function isPathMatch(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is public (no auth required)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Get the required role for a protected route
 */
function getRequiredRole(pathname: string): "STUDENT" | "MENTOR" | null {
  if (isPathMatch(pathname, PROTECTED_ROUTES.student)) return "STUDENT";
  if (isPathMatch(pathname, PROTECTED_ROUTES.mentor)) return "MENTOR";
  return null;
}

/**
 * Verify authentication token with backend and get user data
 */
async function verifyAuth(
  token: string,
): Promise<{ user: { role: string; id: string } } | null> {
  try {
    console.log(`Verifying token with API: ${API_URL}/auth/me`);
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Auth verification failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.data?.user) {
      console.error("Auth response missing user data:", data);
      return null;
    }

    return { user: data.data.user };
  } catch (error) {
    console.error("Auth verification exception:", error);
    return null;
  }
}
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiredRole = getRequiredRole(pathname);
  if (!requiredRole) {
    // Not a protected route, allow access
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get("token")?.value;

  if (!token) {
    // No token - redirect to login with redirectTo parameter
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("tab", "login");
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token with backend
  const authResult = await verifyAuth(token);

  if (!authResult) {
    // Invalid/expired token - clear cookie and redirect to login
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("tab", "login");
    loginUrl.searchParams.set("redirectTo", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }

  const userRole = authResult.user.role;

  // Check role-based access
  if (userRole !== requiredRole) {
    // Wrong role - redirect to appropriate dashboard
    const redirectPath =
      userRole === "MENTOR" ? "/mentor/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Valid authentication and correct role - allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth pages)
     * - root (home page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth|$).*)",
  ],
};
