"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { SegmentedTabs } from "./segmented-tabs";
import { useState } from "react";

export function AuthForms() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "login" | "signup") || "login";
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);

  // Update URL when tab changes (for shareable URLs)
  // Uses replaceState to avoid history clutter
  const handleTabChange = (tab: string) => {
    if (tab !== "login" && tab !== "signup") {
      return;
    }

    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div className="w-full flex items-center">
        {/* Segmented Tabs */}
        <SegmentedTabs
          items={[
            { value: "login", label: "Log In" },
            { value: "signup", label: "Create Account" },
          ]}
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full min-w-[280px] sm:min-w-[350px]"
          maxWidth="max-w-[400px]"
        />

        {/* Student Only Badge */}
        {initialTab === "signup" && (
          <div className="ml-auto hidden sm:flex items-center justify-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md  w-fit">
            <span
              className="material-symbols-outlined text-[14px]"
              aria-hidden="true"
            >
              school
            </span>
            <span className="text-label-sm font-medium">Student Only</span>
          </div>
        )}
      </div>

      {/* Conditional Form Rendering */}
      {activeTab === "login" ? <LoginForm /> : <SignupForm />}
    </div>
  );
}
