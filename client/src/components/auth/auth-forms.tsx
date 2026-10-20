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
  const handleTabChange = (tab: "login" | "signup") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* Segmented Tabs */}
      <SegmentedTabs
        items={[
          { value: "login", label: "Log In" },
          { value: "signup", label: "Create Account" },
        ]}
        value={activeTab}
        onValueChange={handleTabChange}
        className="mx-auto"
        maxWidth="max-w-[400px]"
      />

      {/* Conditional Form Rendering */}
      {activeTab === "login" ? <LoginForm /> : <SignupForm />}
    </div>
  );
}
