"use client";

import { useState } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { BrandPanel } from "@/components/auth/brand-panel";
import { AuthStateSwitcher } from "@/components/auth/auth-state-switcher";
import { AuthSuccessView } from "@/components/auth/auth-success-view";

export default function SignupPage() {
  const [demoState, setDemoState] = useState<"default" | "error" | "loading" | "success">("default");
  const [showSuccess, setShowSuccess] = useState(false);

  // For demo purposes - in real app this would be controlled by form submission
  const handleDemoSignup = () => {
    setShowSuccess(true);
    setDemoState("success");
  };

  return (
    <AuthLayout
      brandPanel={
        <BrandPanel
          cohortText="FALL 2025 COHORT • STUDENT REGISTRATION"
          headline="Submit. Review. Ship."
          description="A single, authenticated gateway for students submitting production-grade course repos and mentors evaluating live merge requests."
          features={[
            {
              icon: <span className="material-symbols-outlined text-[20px]">sync</span>,
              title: "Synchronous Code Reviews",
              description: "Automated commit validation, branch attestation, and deterministic webhook verification.",
            },
            {
              icon: <span className="material-symbols-outlined text-[20px]">grading</span>,
              title: "Rubric-Based Feedback",
              description: "Deterministic criteria evaluations, automated test harness logs, and inline code annotations.",
            },
          ]}
          terminal={{
            prompt: "hub auth register --role student",
            lines: [
              { text: "> identity: new student registration" },
              { text: "> policy: verified academic email required" },
              { text: "✓ gateway ready for student intake", className: "text-emerald-400" },
            ],
          }}
        />
      }
    >
      <AuthStateSwitcher state={demoState} onStateChange={setDemoState} />
      {showSuccess ? (
        <AuthSuccessView
          email="alex@cs.berkeley.edu"
          secondaryAction={{
            text: "Register another student account",
            onClick: () => {
              setShowSuccess(false);
              setDemoState("default");
            },
          }}
        />
      ) : (
        <SignupForm />
      )}
    </AuthLayout>
  );
}