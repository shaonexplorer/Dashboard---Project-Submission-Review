"use client";

import { useSearchParams } from "next/navigation";
import { MentorDashboardClient } from "@/components/mentor/mentor-dashboard-client";

export default function MentorDashboardPage() {
  // Read search params to sync initial state with URL (handled internally by MentorDashboardClient)
  useSearchParams();

  return <MentorDashboardClient />;
}