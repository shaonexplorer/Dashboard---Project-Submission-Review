import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the base URL for API calls.
 * Uses Next.js proxy route (/api/backend) to handle cross-origin cookies.
 * The auth cookie is set on the Next.js domain and automatically forwarded to the backend.
 */
export function getApiUrl(): string {
  return "/api/backend"
}