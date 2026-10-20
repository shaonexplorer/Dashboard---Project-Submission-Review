"use client";

import { useCurrentUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      const redirectTo = user.role === "MENTOR" ? "/mentor/dashboard" : "/student/dashboard";
      router.push(redirectTo);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md text-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Project Submission & Review Dashboard</CardTitle>
            <CardDescription>
              A platform where students submit project work and mentors review submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <p className="text-lg">
                  Welcome back, <span className="font-semibold">{user.fullName}</span>!
                </p>
                <p className="text-muted-foreground">
                  Redirecting to your dashboard...
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Please sign in or create an account to continue.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/signup">Create account</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}