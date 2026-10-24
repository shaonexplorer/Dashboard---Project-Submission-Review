"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { meApi, loginApi, signupApi } from "@/lib/api/auth";
import type { User } from "@/lib/api/auth";
import { saveToken, removeToken, hasToken } from "@/lib/auth/token";
import { queryKeys } from "@/lib/query/query-keys";
import { useIsHydrated } from "@/hooks/use-is-hydrated";

export interface CurrentUserState {
  /** The signed-in user, or `undefined` when there is no session. */
  user: User | undefined;
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

export function useCurrentUser(): CurrentUserState {
  const isHydrated = useIsHydrated();

  const { data: user, isPending } = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async () => {
      const response = await meApi();

      if (!response.data?.user) {
        throw new Error("No user data returned");
      }

      return response.data.user;
    },
    // The request only runs when a token is stored locally, which is the
    // session marker the logout flow clears.
    enabled: hasToken(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // Without a stored token the query never runs, so `isPending` would stay
  // true forever. Once the page is mounted the token decides: present means
  // "still resolving", absent means "there is no session".
  const isResolving = isPending && (!isHydrated || hasToken());

  return { user, isResolving };
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: loginApi,
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.currentUser });
    },
    onSuccess: (data) => {
      if (data.data?.token) {
        saveToken(data.data.token);
      }
      // Invalidate and refetch current user
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });

      // Redirect based on role and redirectTo parameter
      const user = data.data?.user;
      if (user) {
        const redirectTo =
          searchParams.get("redirectTo") ||
          (user.role === "MENTOR" ? "/mentor/dashboard" : "/student/dashboard");
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
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: signupApi,
    onSuccess: (data) => {
      if (data.data?.token) {
        saveToken(data.data.token);
        // If signup returns a token, redirect to dashboard
        const user = data.data.user;
        // Signup always creates STUDENT, but respect redirectTo if provided
        const redirectTo =
          searchParams.get("redirectTo") ||
          (user?.role === "MENTOR"
            ? "/mentor/dashboard"
            : "/student/dashboard");
        router.push(redirectTo);
        router.refresh();
      } else {
        // If signup doesn't return token, redirect to login
        router.push("/auth?tab=login");
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
      removeToken();
      // Clear all queries
      queryClient.clear();
    },
    onSuccess: () => {
      router.push("/auth?tab=login");
      router.refresh();
    },
  });
}
