import { apiRequest } from "./client";

/**
 * An entry in the project catalog.
 *
 * `id` is the readable catalog code the student picks ("ph-01") and the
 * server stores; `name` is the display name the server snapshots onto the
 * submission when it is created.
 */
export interface Project {
  /** The stable catalog code, e.g. "ph-01". */
  id: string;
  /** The display name shown in the picker and in the mentor table. */
  name: string;
  /** Optional one-line brief describing the assignment. */
  description: string | null;
  /** Whether the entry is currently assignable. */
  isActive: boolean;
}

interface ProjectsResponse {
  success: boolean;
  message: string;
  data?: { projects?: Project[] };
}

/**
 * Fetches the catalog of assignable projects.
 *
 * The catalog is effectively static, so the query layer keeps it cached for a
 * while rather than refetching it on every navigation. An empty list is a
 * legitimate answer — a catalog that has not been seeded yet — so it is
 * returned rather than raised as an error.
 */
export async function getProjectsApi(): Promise<Project[]> {
  const response = await apiRequest<ProjectsResponse>("/projects");

  return response.data?.projects ?? [];
}
