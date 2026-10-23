import { prisma } from "../../config/prisma";

/**
 * A catalog entry as it is returned to the client.
 *
 * Only the public fields are exposed: the catalog carries no student- or
 * submission-specific data, and a client must not be able to learn anything
 * about the rows that reference an entry.
 */
export type ProjectEntry = {
  /** The stable, human-readable catalog code ("ph-01"). */
  id: string;
  /** The display name shown in the picker and in the mentor table. */
  name: string;
  /** Optional one-line brief. */
  description: string | null;
  /** Whether the entry is currently assignable. */
  isActive: boolean;
};

/**
 * Reads the active project catalog.
 *
 * Retired entries (`isActive = false`) are filtered out by the database, and
 * the result is ordered by name so the picker is stable between requests —
 * the same catalog always renders in the same order.
 *
 * The endpoint is role-agnostic: a student and a mentor receive the same
 * catalog. The student's own submission state is joined onto it client-side
 * from `GET /api/submissions/me`.
 *
 * @returns The assignable catalog, ordered by name ascending
 */
export const getProjectsService = async (): Promise<ProjectEntry[]> => {
  const projects = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
    },
  });

  return projects;
};
