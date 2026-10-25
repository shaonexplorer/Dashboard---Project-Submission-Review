import { redirect } from "next/navigation";
import {
  getCurrentUserServer,
  getMentorSubmissionsServer,
  getSubmissionStatsServer,
  type SubmissionListQuery,
} from "@/lib/server/api";
import { MentorDashboardClient } from "@/components/mentor/mentor-dashboard-client";

/** The columns the server is able to sort by. */
const SORT_FIELDS: readonly ("createdAt" | "projectName" | "status")[] = [
  "createdAt",
  "projectName",
  "status",
];

function toSortField(id: string | undefined): "createdAt" | "projectName" | "status" {
  return SORT_FIELDS.find((field) => field === id) ?? "createdAt";
}

export default async function MentorDashboardPage({
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
    redirect("/auth?tab=login&redirectTo=/mentor/dashboard");
  }

  // Redirect non-mentors
  if (user.role !== "MENTOR") {
    redirect("/student/dashboard");
  }

  // Parse query parameters
  const page = Math.max(1, parseInt(resolvedSearchParams.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(resolvedSearchParams.limit ?? "10", 10)));
  const search = resolvedSearchParams.search ?? "";
  const status = (resolvedSearchParams.status ?? "") as SubmissionListQuery["status"];
  const sortBy = toSortField(resolvedSearchParams.sortBy);
  const sortOrder = resolvedSearchParams.sortOrder === "asc" ? "asc" : "desc";

  const query: SubmissionListQuery = {
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
  };

  // Fetch data in parallel on the server
  const [submissionsData, stats] = await Promise.all([
    getMentorSubmissionsServer(query, { cache: "no-store" }),
    getSubmissionStatsServer({ cache: "no-store" }),
  ]);

  // Pass initial data to client component for hydration
  return (
    <MentorDashboardClient
      initialSubmissions={submissionsData.submissions}
      initialPagination={submissionsData.pagination}
      initialStats={stats}
    />
  );
}