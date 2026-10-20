/**
 * Token management utilities for cookie-based authentication.
 * Since we use httpOnly cookies, the token is automatically sent with requests.
 * These utilities are for client-side state management only.
 */

const TOKEN_KEY = "auth_token";

export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function hasToken(): boolean {
  return getToken() !== null;
}