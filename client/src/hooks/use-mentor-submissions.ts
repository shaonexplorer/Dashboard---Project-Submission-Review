"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSubmissionsApi,
  getSubmissionStatsApi,
  updateSubmissionStatusApi,
} from "@/lib/api/mentor-submissions";
import type {
  ReviewSubmissionPayload,
  SubmissionListQuery,
  MentorSubmission,
  PaginationMeta,
  SubmissionStats,
} from "@/lib/api/mentor-submissions";
import { queryKeys } from "@/lib/query/query-keys";

/**
 * Loads one page of the mentor submission table.
 *
 * The query key carries the whole table state, so changing the page, the
 * status filter, the search term or the sorting produces a different key and
 * therefore a new server request. The rows of the previous page stay on screen
 * while the next one is loading, which keeps the layout stable without ever
 * showing stale rows as if they were the new result.
 */
export function useMentorSubmissions(
  query: SubmissionListQuery,
  options?: { initialData?: { submissions: MentorSubmission[]; pagination: PaginationMeta } },
) {
  return useQuery({
    queryKey: queryKeys.mentorSubmissions(query),
    queryFn: () => getSubmissionsApi(query),
    // Authentication is handled by BetterAuth via httpOnly cookies.
    // The query runs unconditionally; a 401 response will be handled by the page.
    // Keep the previous page visible while the next one loads, instead of
    // collapsing the table into a skeleton on every interaction.
    placeholderData: keepPreviousData,
    // The server is the source of truth for the queue, so the table is
    // re-read whenever the dashboard is opened.
    staleTime: 0,
    retry: false,
    initialData: options?.initialData,
  });
}

/**
 * Loads the aggregate counts shown in the statistics cards.
 *
 * The counts describe the whole table, so they are never derived from the
 * rows the table happens to have loaded.
 */
export function useSubmissionStats(options?: { initialData?: SubmissionStats }) {
  return useQuery({
    queryKey: queryKeys.mentorSubmissionStats,
    queryFn: getSubmissionStatsApi,
    // Authentication is handled by BetterAuth via httpOnly cookies.
    // The query runs unconditionally; a 401 response will be handled by the page.
    staleTime: 0,
    retry: false,
    initialData: options?.initialData,
  });
}

/**
 * Records a review decision on a submission.
 *
 * A review changes both the row in the table and the counts in the
 * statistics cards, so the whole mentor dashboard is invalidated once the
 * server has confirmed the change.
 */
export function useReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: ReviewSubmissionPayload;
    }) => updateSubmissionStatusApi(submissionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.mentorDashboard,
      });
    },
  });
}