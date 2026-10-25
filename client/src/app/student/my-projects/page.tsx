import { redirect } from "next/navigation";
import { getCurrentUserServer, getMySubmissionsPaginatedServer, getMySubmissionStatsServer, getProjectsServer, type StudentSubmissionListQuery } from "@/lib/server/api";
import { StudentMyProjectsClient } from "@/components/student/student-my-projects-client";

/** The columns the server is able to sort by. */
const SORT_FIELDS: readonly ("createdAt" | "projectName" | "status")[] = [
  "createdAt",
  "projectName",
  "status",
];

function toSortField(id: string | undefined): "createdAt" | "projectName" | "status" {
  return SORT_FIELDS.find((field) => field === id) ?? "createdAt";
}

export default async function StudentMyProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  // Await searchParams (Next.js 15)
  const resolvedSearchParams = await searchParams;

  // Fetch user session on the server
  const user = await getCurrentUserServer({ cache: "no-store" });

  if (!user) {
    redirect("/auth?tab=login&redirectTo=/student/my-projects");
  }

  // Parse query parameters
  const page = Math.max(1, parseInt(resolvedSearchParams.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(resolvedSearchParams.limit ?? "10", 10)));
  const search = resolvedSearchParams.search ?? "";
  const status = (resolvedSearchParams.status ?? "") as StudentSubmissionListQuery["status"];
  const sortBy = toSortField(resolvedSearchParams.sortBy);
  const sortOrder = resolvedSearchParams.sortOrder === "asc" ? "asc" : "desc";

  const query: StudentSubmissionListQuery = {
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
  };

  // Fetch data in parallel on the server
  const [paginatedData, stats, projects] = await Promise.all([
    getMySubmissionsPaginatedServer(query, { cache: "no-store" }),
    getMySubmissionStatsServer({ cache: "no-store" }),
    getProjectsServer({ revalidate: 3600 }),
  ]);

  // Pass initial data to client component for hydration
  return (
    <StudentMyProjectsClient
      initialProjects={paginatedData.submissions}
      initialPagination={paginatedData.pagination}
      initialStats={stats}
      initialProjectsCatalog={projects}
    />
  );
}