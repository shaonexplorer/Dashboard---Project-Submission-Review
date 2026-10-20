import { getApiUrl } from "@/lib/utils";

const API_BASE_URL = getApiUrl();

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
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  return handleResponse<AuthResponse>(response);
}

export async function loginApi(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  return handleResponse<AuthResponse>(response);
}

export async function meApi(): Promise<MeResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<MeResponse>(response);
}

export async function logoutApi(): Promise<void> {
  // Since we use cookie-based auth, logout is just clearing the cookie
  // The backend doesn't need a specific logout endpoint
  // We'll handle token removal on the frontend
}