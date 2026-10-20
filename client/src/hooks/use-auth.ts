"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { meApi, loginApi, signupApi } from "@/lib/api/auth";
import { saveToken, removeToken, hasToken } from "@/lib/auth/token";
import type { User, AuthResponse } from "@/lib/api/auth";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await meApi();
      if (!response.data?.user) {
        throw new Error("No user data returned");
      }
      return response.data.user;
    },
    enabled: hasToken(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: loginApi,
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["currentUser"] });
    },
    onSuccess: (data) => {
      if (data.data?.token) {
        saveToken(data.data.token);
      }
      // Invalidate and refetch current user
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Redirect based on role and redirectTo parameter
      const user = data.data?.user;
      if (user) {
        const redirectTo = searchParams.get("redirectTo") ||
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
        const redirectTo = searchParams.get("redirectTo") ||
          (user?.role === "MENTOR" ? "/mentor/dashboard" : "/student/dashboard");
        router.push(redirectTo);
        router.refresh();
      } else {
        // If signup doesn't return token, redirect to login
        router.push("/login");
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
      router.push("/login");
      router.refresh();
    },
  });
}