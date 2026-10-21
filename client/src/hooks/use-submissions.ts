"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSubmissionApi, getMySubmissionApi } from "@/lib/api/submissions";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { hasToken } from "@/lib/auth/token";

/**
 * Loads the authenticated student's own submission.
 *
 * Resolves to `null` when the student has not submitted a project yet, which
 * is what decides between the submission form and the submitted-project view.
 */
export function useMySubmission() {
  return useQuery({
    queryKey: queryKeys.mySubmission,
    queryFn: getMySubmissionApi,
    // The request only runs when a token is stored locally, which is the
    // session marker the logout flow clears.
    enabled: hasToken(),
    // The server is the source of truth for "does a submission exist", so the
    // query should never be served from a stale cache after a navigation.
    staleTime: 0,
    // A 401/403 will not succeed on retry — surface the error immediately.
    retry: false,
  });
}

/**
 * Creates a project submission.
 *
 * On success the new submission is written straight into the query cache so
 * the dashboard switches to the submitted-project view without a refetch, and
 * the cache is then invalidated so the server stays the source of truth.
 * On `409 Conflict` the same cache entry is invalidated, so the dashboard
 * re-syncs with the server and shows the submission that already exists.
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubmissionApi,
    onSuccess: (submission) => {
      queryClient.setQueryData(queryKeys.mySubmission, submission);
      void queryClient.invalidateQueries({ queryKey: queryKeys.mySubmission });
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.mySubmission });
      }
    },
  });
}
