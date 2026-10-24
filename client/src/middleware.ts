import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Ensure middleware runs in Node.js runtime for JWT verification compatibility
export const runtime = "nodejs";

/**
 * Protected routes configuration
 */
const PROTECTED_ROUTES = {
  student: ["/student"],
  mentor: ["/mentor"],
} as const;

// const PROTECTED_ROUTES = {
//   student: ["/hello"],
//   mentor: ["/hello"],
// } as const;

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
 * JWT payload structure (must match backend TokenPayload)
 */
interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Verify JWT token locally using the shared secret.
 * This avoids cross-domain cookie issues when frontend and backend are on different domains.
 * Uses jose (Edge Runtime compatible) instead of jsonwebtoken.
 */
async function verifyToken(token: string): Promise<TokenPayload | null> {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET not configured in middleware");
    return null;
  }

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
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

  // Verify token locally (no cross-domain call to backend)
  const payload = await verifyToken(token);

  if (!payload) {
    // Invalid/expired token - clear cookie and redirect to login
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("tab", "login");
    loginUrl.searchParams.set("redirectTo", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }

  const userRole = payload.role;

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
