"use client";

import { useCurrentUser } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";

export default function StudentDashboardPage() {
  const { data: user, isLoading } = useCurrentUser();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to access the dashboard</p>
          <Button asChild className="mt-4">
            <a href="/login">Sign in</a>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Student Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-lg">Welcome, <span className="font-semibold">{user.fullName}</span>!</p>
            <p className="text-muted-foreground">Your role: <span className="font-medium">{user.role}</span></p>
            <p className="text-muted-foreground">Email: {user.email}</p>
            <Button variant="outline" onClick={() => logout()}>
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Project submission and review features will be implemented in upcoming phases.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}