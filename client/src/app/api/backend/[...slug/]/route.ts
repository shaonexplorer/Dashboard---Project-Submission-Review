import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Proxy all backend API calls through Next.js to handle cross-origin cookies.
 *
 * The auth cookie is set on the Next.js domain (by /api/auth/login, /api/auth/signup).
 * Direct browser calls to the backend (different domain) would not send this cookie.
 * By proxying through Next.js, the cookie is automatically included in the forwarded request.
 */
type RouteParams = Promise<Record<string, string | string[]>>;

async function getSlug(params: RouteParams): Promise<string> {
  const resolved = await params;
  const slug = resolved.slug;
  return Array.isArray(slug) ? slug.join("/") : String(slug);
}

export async function GET(
  request: NextRequest,
  context: { params: RouteParams },
) {
  const slug = await getSlug(context.params);
  return proxyRequest(request, slug);
}

export async function POST(
  request: NextRequest,
  context: { params: RouteParams },
) {
  const slug = await getSlug(context.params);
  return proxyRequest(request, slug);
}

export async function PUT(
  request: NextRequest,
  context: { params: RouteParams },
) {
  const slug = await getSlug(context.params);
  return proxyRequest(request, slug);
}

export async function PATCH(
  request: NextRequest,
  context: { params: RouteParams },
) {
  const slug = await getSlug(context.params);
  return proxyRequest(request, slug);
}

export async function DELETE(
  request: NextRequest,
  context: { params: RouteParams },
) {
  const slug = await getSlug(context.params);
  return proxyRequest(request, slug);
}

export async function OPTIONS(
  request: NextRequest,
  context: { params: RouteParams },
) {
  const slug = await getSlug(context.params);
  return proxyRequest(request, slug);
}

async function proxyRequest(
  request: NextRequest,
  slug: string,
) {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const backendUrl = `${API_URL}/${slug}${searchParams ? `?${searchParams}` : ""}`;

  // Get the auth token from the Next.js domain cookie
  const token = request.cookies.get("token")?.value;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Cookie: `token=${token}` }),
  };

  // Forward the request body for non-GET/HEAD requests
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text();

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      // Don't follow redirects - let the client handle them
      redirect: "manual",
    });

    // Create a new response with the backend's body and headers
    const responseHeaders = new Headers();
    // Copy relevant headers from backend response
    response.headers.forEach((value, key) => {
      // Skip headers that shouldn't be proxied
      if (!["set-cookie", "content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Handle Set-Cookie from backend - we don't need to set it on Next.js domain
    // since our auth cookies are managed by /api/auth/* routes
    // But we should forward it if backend sets a new token (e.g., token refresh)
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      // For security, we don't automatically forward Set-Cookie from backend
      // The /api/auth/me route handles token validation
      console.debug("Backend returned Set-Cookie (not forwarded):", setCookieHeader);
    }

    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Backend service unavailable" },
      { status: 502 },
    );
  }
}