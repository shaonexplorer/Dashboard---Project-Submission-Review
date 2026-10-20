"use client";

import { useSearchParams } from "next/navigation";
import { AuthForms } from "@/components/auth/auth-forms";
import { AuthLayout } from "@/components/auth/auth-layout";
import { BrandPanel } from "@/components/auth/brand-panel";
import { AuthStateSwitcher } from "@/components/auth/auth-state-switcher";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "login";

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
      {/* <AuthStateSwitcher state={demoState} onStateChange={setDemoState} /> */}
      <AuthForms key={currentTab} />
    </AuthLayout>
  );
}
