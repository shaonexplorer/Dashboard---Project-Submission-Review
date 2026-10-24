import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie (set on Next.js domain)
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    // Forward request to Express backend with token in Cookie header
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // If token is invalid/expired, clear the cookie
      const errorResponse = NextResponse.json(data, {
        status: response.status,
      });
      if (response.status === 401) {
        errorResponse.cookies.delete("token");
      }
      return errorResponse;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Me API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
