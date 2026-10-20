"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForms } from "@/components/auth/auth-forms";
import { AuthLayout } from "@/components/auth/auth-layout";
import { BrandPanel } from "@/components/auth/brand-panel";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <AuthLayout
      brandPanel={
        <BrandPanel
          cohortText="WINTER 2025 EVALUATION CYCLE"
          headline="Submit. Review. Ship."
          description="A single, authenticated gateway for students submitting production-grade course repos and mentors evaluating live merge requests."
          features={[
            {
              icon: (
                <span className="material-symbols-outlined text-[20px]">
                  verified
                </span>
              ),
              title: "Synchronous Student & Mentor Workflows",
              description:
                "Dynamic role routing directs students to project submissions and faculty to rubric evaluation queues.",
            },
            {
              icon: (
                <span className="material-symbols-outlined text-[20px]">
                  terminal
                </span>
              ),
              title: "Git Metadata & Branch Attestation",
              description:
                "Automated validation of commit sign-offs, CI telemetry, and cohort repo branches.",
            },
          ]}
          terminal={{
            prompt: "hub auth status --verified",
            lines: [
              { text: "> session: academic_id_980242" },
              { text: "> key_exchange: TLSv1.3 [AES-GCM-256]" },
              {
                text: "✓ ready for cohort assignment routing",
                className: "text-primary",
              },
            ],
          }}
        />
      }
    >
      <Suspense fallback={<AuthFormsFallback />}>
        <AuthFormsWithKey />
      </Suspense>
    </AuthLayout>
  );
}

/**
 * Reads the requested tab from the URL.
 *
 * `useSearchParams` opts the component out of static rendering, so it has to
 * live behind a Suspense boundary.
 */
function AuthFormsWithKey() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "login";

  return <AuthForms key={currentTab} />;
}

/** Placeholder shown while the URL parameters are resolved. */
function AuthFormsFallback() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-10 w-full sm:min-w-[350px]" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
