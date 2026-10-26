import { fetcher } from "./fetcher";

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

export async function signupApi(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return fetcher<AuthResponse>(`${AUTH_API_BASE_URL}/signup`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginApi(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return fetcher<AuthResponse>(`${AUTH_API_BASE_URL}/login`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function meApi(): Promise<MeResponse> {
  return fetcher<MeResponse>(`${AUTH_API_BASE_URL}/me`, {
    method: "GET",
  });
}

export async function logoutApi(): Promise<void> {
  await fetcher<void>(`${AUTH_API_BASE_URL}/logout`, {
    method: "POST",
  });
}
