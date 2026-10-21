import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder rows for the submission table.
 *
 * The skeleton mirrors the real table's shape so the page keeps its layout
 * while the first page is loading, instead of collapsing and then jumping.
 */
export function SubmissionTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {[
              "Student",
              "Project",
              "Repository",
              "Live Link",
              "Status",
              "Submitted At",
              "Actions",
            ].map((label) => (
              <TableHead key={label}>{label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-44" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-36" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-28 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-36" />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1.5">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-7 w-20" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
