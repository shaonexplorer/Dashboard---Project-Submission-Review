// Use Next.js API routes for authentication (they proxy to backend and set cookies on frontend domain)
const AUTH_API_BASE_URL = "/api/auth";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "STUDENT" | "MENTOR";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token?: string;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface MeResponse {
  success: boolean;
  message: string;
  data?: { user: User };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;

  if (!response.ok) {
    const errorData = data as unknown as AuthResponse;
    throw new Error(errorData.message || "An error occurred");
  }

  return data;
}

export async function signupApi(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // No credentials: "include" needed - cookies are set by Next.js API routes on same domain
    body: JSON.stringify(input),
  });

  return handleResponse<AuthResponse>(response);
}

export async function loginApi(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // No credentials: "include" needed - cookies are set by Next.js API routes on same domain
    body: JSON.stringify(input),
  });

  return handleResponse<AuthResponse>(response);
}

export async function meApi(): Promise<MeResponse> {
  const response = await fetch(`${AUTH_API_BASE_URL}/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // No credentials: "include" needed - cookies are automatically sent for same-domain requests
  });

  return handleResponse<MeResponse>(response);
}

export async function logoutApi(): Promise<void> {
  const response = await fetch(`${AUTH_API_BASE_URL}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
}
