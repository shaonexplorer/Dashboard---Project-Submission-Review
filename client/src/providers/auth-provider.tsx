"use client";

import { authClient } from "@/lib/auth/client";

// This component ensures the auth client is initialized on the client side.
// BetterAuth React client manages session state globally via nanostores,
// so no SessionProvider is needed.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize the client by accessing it
  // This ensures the client is set up before any components use useSession
  void authClient;

  return <>{children}</>;
}