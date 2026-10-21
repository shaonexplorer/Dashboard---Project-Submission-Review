"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubmissionApi,
  getMySubmissionsApi,
  resubmitSubmissionApi,
  type Submission,
} from "@/lib/api/submissions";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { hasToken } from "@/lib/auth/token";

/**
 * Loads every submission the authenticated student owns.
 *
 * The list is empty when nothing has been submitted yet — that is a normal
 * state, not a failure — so the hook resolves to `[]` and the page decides
 * what to render from the length of the list.
 */
export function useMySubmissions() {
  return useQuery({
    queryKey: queryKeys.mySubmissions,
    queryFn: getMySubmissionsApi,
    // The request only runs when a token is stored locally, which is the
    // session marker the logout flow clears.
    enabled: hasToken(),
    // The server is the source of truth for "what has been submitted", so the
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
      queryClient.setQueryData<Submission[]>(queryKeys.mySubmissions, (current) =>
        current ? [submission, ...current] : [submission],
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.mySubmissions });
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.mySubmissions });
      }
    },
  });
}

/**
 * Replaces the deliverable of a rejected submission.
 *
 * The server reuses the existing row, so the returned submission replaces the
 * old one in the cache rather than being appended to the list. The cache is
 * then invalidated so the attempt counter and the review state come from the
 * server.
 */
export function useResubmitSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: Parameters<typeof resubmitSubmissionApi>[1];
    }) => resubmitSubmissionApi(submissionId, payload),
    onSuccess: (submission) => {
      queryClient.setQueryData<Submission[]>(queryKeys.mySubmissions, (current) =>
        current?.map((item) => (item.id === submission.id ? submission : item)) ??
          [submission],
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.mySubmissions });
    },
  });
}
