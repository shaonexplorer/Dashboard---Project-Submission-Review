"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useIsHydrated } from "@/hooks/use-is-hydrated";

export interface CurrentUserState {
  /** The signed-in user, or `undefined` when there is no session. */
  user: { id: string; name: string | null; email: string; role: "STUDENT" | "MENTOR"; image?: string | null } | undefined;
  /**
   * True while the session is still being resolved.
   *
   * The server cannot know whether a session exists (the token lives in an
   * httpOnly cookie), and the browser cannot know it before hydration. This
   * stays true on both sides of the hydration boundary so the first client
   * render matches the server HTML, and turns false as soon as the answer is
   * known — including when there is no session at all.
   */
  isResolving: boolean;
}

interface BetterAuthSession {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    role?: string;
    image?: string | null;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export function useCurrentUser(): CurrentUserState {
  const isHydrated = useIsHydrated();

  const { data: session, isPending } = useQuery<BetterAuthSession | null>({
    queryKey: queryKeys.currentUser,
    queryFn: async () => {
      const response = await authClient.getSession();
      return response.data as BetterAuthSession | null;
    },
    // The request only runs when a session might exist
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // Without a session the query never runs, so `isPending` would stay
  // true forever. Once the page is mounted the session decides: present means
  // "still resolving", absent means "there is no session".
  const isResolving = isPending && (!isHydrated || !!session);

  // Transform BetterAuth user to our expected type
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email,
        role: (session.user.role === "MENTOR" ? "MENTOR" : "STUDENT") as "STUDENT" | "MENTOR",
        image: session.user.image ?? null,
      }
    : undefined;

  return { user, isResolving };
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const result = await authClient.signIn.email(data);
      if (result.error) {
        throw new Error(result.error.message || "Login failed");
      }
      return result.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.currentUser });
    },
    onSuccess: () => {
      // Invalidate and refetch current user
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });

      // Redirect based on role and redirectTo parameter
      const sessionData = queryClient.getQueryData<BetterAuthSession>(queryKeys.currentUser);
      if (sessionData?.user) {
        const redirectTo =
          searchParams.get("redirectTo") ||
          (sessionData.user.role === "MENTOR" ? "/mentor/dashboard" : "/student/dashboard");
        router.push(redirectTo);
        router.refresh();
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
}

export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const result = await authClient.signUp.email(data);
      if (result.error) {
        throw new Error(result.error.message || "Signup failed");
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch current user
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });

      // Redirect based on role and redirectTo parameter
      const sessionData = queryClient.getQueryData<BetterAuthSession>(queryKeys.currentUser);
      if (sessionData?.user) {
        const redirectTo =
          searchParams.get("redirectTo") ||
          (sessionData.user.role === "MENTOR" ? "/mentor/dashboard" : "/student/dashboard");
        router.push(redirectTo);
        router.refresh();
      } else {
        router.push("/student/dashboard");
        router.refresh();
      }
    },
    onError: (error) => {
      console.error("Signup failed:", error);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      router.push("/auth?tab=login");
      router.refresh();
    },
  });
}