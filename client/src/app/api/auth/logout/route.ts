import { NextResponse } from "next/server";

export async function POST() {
  // Clear the auth cookie
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.delete("token");

  return response;
}