"use client";

import { useCurrentUser } from "@/hooks/use-auth";
import { StudentMyProjectsClient } from "@/components/student/student-my-projects-client";
import { AppFooter, AppHeader } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudentMyProjectsPage() {
  const { user, isResolving: isUserResolving } = useCurrentUser();

  if (isUserResolving) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 w-full pt-16">
          <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6 animate-pulse">
            <Skeleton className="h-12 w-64 rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 w-full pt-16 flex items-center justify-center px-6">
          <div className="max-w-md text-center flex flex-col gap-4">
            <span
              className="material-symbols-outlined text-[32px] text-outline mx-auto"
              aria-hidden="true"
            >
              lock
            </span>
            <h1 className="text-headline-md text-on-surface">
              Please sign in to view your projects
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Your session is missing or has expired. Sign in again to continue.
            </p>
            <Button
              render={
                <Link
                  href="/auth?tab=login&redirectTo=/student/my-projects"
                />
              }
              className="self-center"
            >
              Sign in
            </Button>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return <StudentMyProjectsClient />;
}
