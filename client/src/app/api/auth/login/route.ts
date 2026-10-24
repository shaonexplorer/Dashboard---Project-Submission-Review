import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Cookie options for the JWT access token.
 * Set on the frontend (Next.js) domain so middleware can read it.
 */
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 },
      );
    }

    // Forward request to Express backend
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Backend returns { success: true, message, data: { user, token } }
    const { user, token } = data.data || {};

    if (!token || !user) {
      return NextResponse.json(
        { success: false, message: "Invalid response from authentication server" },
        { status: 500 },
      );
    }

    // Set cookie on Next.js domain
    const responseWithCookie = NextResponse.json({
      success: true,
      message: data.message,
      data: { user },
    });

    responseWithCookie.cookies.set("token", token, cookieOptions);

    return responseWithCookie;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}