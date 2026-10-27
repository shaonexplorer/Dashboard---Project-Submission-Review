import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for route protection.
 *
 * Checks for the presence of the `auth_token` cookie.
 * If missing on protected routes, redirects to login.
 *
 * Real session validation happens in the Express backend via the bearer plugin.
 * This middleware only provides a basic gate to prevent unauthenticated access
 * to protected routes on the client side.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", req.url);
    // Preserve the intended destination for post-login redirect
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};