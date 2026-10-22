"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirects /student/submission to /student/my-projects
 *
 * The "My Projects" page is the canonical route. This route exists for
 * backward compatibility and redirects to the new location.
 */
export default function StudentSubmissionRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/my-projects");
  }, [router]);

  return null;
}