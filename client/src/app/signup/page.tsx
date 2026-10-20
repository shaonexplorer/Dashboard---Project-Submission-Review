"use client";

import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Project Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Sign up to get started</p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}