"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubmissionApi,
  getMySubmissionsApi,
  getMySubmissionsPaginatedApi,
  getMySubmissionStatsApi,
  resubmitSubmissionApi,
  type Submission,
  type StudentSubmissionListQuery,
  type StudentSubmissionStats,
  type PaginatedSubmissionsResponse,
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
 * Loads one page of the student's own submission table with server-side
 * pagination, filtering, searching and sorting.
 *
 * The query key carries the whole table state, so changing the page, the
 * status filter, the search term or the sorting produces a different key and
 * therefore a new server request. The rows of the previous page stay on screen
 * while the next one is loading, which keeps the layout stable without ever
 * showing stale rows as if they were the new result.
 */
export function useMySubmissionsPaginated(query: StudentSubmissionListQuery) {
  return useQuery<PaginatedSubmissionsResponse>({
    queryKey: queryKeys.mySubmissionsPaginated(query),
    queryFn: () => getMySubmissionsPaginatedApi(query),
    enabled: hasToken(),
    // Keep the previous page visible while the next one loads, instead of
    // collapsing the table into a skeleton on every interaction.
    placeholderData: keepPreviousData,
    // The server is the source of truth for the queue, so the table is
    // re-read whenever the dashboard is opened.
    staleTime: 0,
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

/**
 * Fetches aggregate submission counts for the authenticated student.
 *
 * Used for the metric cards and status filter tab counts.
 */
export function useMySubmissionStats() {
  return useQuery<StudentSubmissionStats>({
    queryKey: queryKeys.mySubmissionsStats,
    queryFn: getMySubmissionStatsApi,
    enabled: hasToken(),
    staleTime: 30 * 1000, // 30 seconds - stats don't change often
    retry: false,
  });
}

/**
 * Fetches a single submission by ID.
 *
 * Uses the paginated API with a search filter for the specific ID,
 * then returns the matching submission. This avoids needing a dedicated
 * backend endpoint while still getting fresh data.
 */
export function useSubmissionById(submissionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.submissionById(submissionId),
    queryFn: async () => {
      if (!submissionId) return null;
      // Fetch all submissions and find the one with matching ID
      const submissions = await getMySubmissionsApi();
      return submissions.find((s) => s.id === submissionId) ?? null;
    },
    enabled: hasToken() && !!submissionId,
    staleTime: 0,
    retry: false,
  });
}
