"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query/query-keys";
import type { Project } from "@/lib/api/projects";

/**
 * Loads the project catalog.
 *
 * The catalog is read-only and effectively static — it is seeded, not
 * edited at runtime — so it is kept fresh for a while instead of being
 * refetched on every navigation. The picker opens against this list, and a
 * catalog that is already in memory opens instantly.
 */
export function useProjects(options?: { initialData?: Project[] }) {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: getProjectsApi,
    // Authentication is handled by BetterAuth via httpOnly cookies.
    // The query runs unconditionally; a 401 response will be handled by the page.
    // The catalog only changes when the seed is re-run, so five minutes of
    // freshness is plenty.
    staleTime: 5 * 60 * 1000,
    // A 401/403 will not succeed on retry — surface the error immediately.
    retry: false,
    initialData: options?.initialData,
  });
}
