"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSignup } from "@/hooks/use-auth";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui";
import {
  PasswordInput,
  PasswordStrength,
  ErrorBanner,
  InlineError,
  PrimaryActionButton,
  SSOButtons,
  AuthFooter,
  SegmentedTabs,
} from "@/components/auth";

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: signup, isPending } = useSignup();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const passwordValue = form.watch("password");
  const confirmPasswordValue = form.watch("confirmPassword");

  function onSubmit(data: SignupInput) {
    setServerError(null);
    signup(data, {
      onError: (error) => {
        setServerError(error.message || "Signup failed. Please try again.");
      },
    });
  }

  const isError = !!serverError;
  const fullNameError = form.formState.errors.fullName?.message;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const confirmPasswordError = form.formState.errors.confirmPassword?.message;
  const honorError = form.formState.errors.honorCode?.message;

  // Password requirements for real-time validation
  const requirements = [
    {
      id: "length",
      label: "At least 8 characters",
      test: (pw: string) => pw.length >= 8,
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      test: (pw: string) => /[A-Z]/.test(pw),
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      test: (pw: string) => /[a-z]/.test(pw),
    },
    {
      id: "number",
      label: "One number",
      test: (pw: string) => /[0-9]/.test(pw),
    },
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Segmented Tabs */}
      <SegmentedTabs
        items={[
          { value: "login", label: "Log In" },
          { value: "signup", label: "Create Account" },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
        maxWidth="max-w-[280px]"
      />

      {/* Student Only Badge */}
      <div className="hidden sm:flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mx-auto max-w-[280px]">
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          school
        </span>
        <span className="text-label-sm font-medium">Student Only</span>
      </div>

      {/* Card Header */}
      <div className="space-y-1.5 text-center">
        <h2 className="text-headline-lg text-on-surface font-semibold tracking-tight">
          Create your account
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Create a student account to submit your project.
        </p>
      </div>

      {/* Global Error Banner */}
      <ErrorBanner
        message={serverError || ""}
        title="Registration halted"
        isVisible={isError}
      />

      {/* Full Name Field */}
      <Input
        id="fullName"
        name="fullName"
        type="text"
        label="Full Name"
        placeholder="John Doe"
        error={fullNameError}
        isError={!!fullNameError}
        disabled={isPending}
        required
        {...form.register("fullName")}
      />

      {/* Email Field */}
      <Input
        id="email"
        name="email"
        type="email"
        label="Email Address"
        placeholder="john@example.com"
        hint="Use .edu or university domain"
        error={emailError}
        isError={!!emailError}
        disabled={isPending}
        required
        {...form.register("email")}
      />

      {/* Password Field */}
      <div className="space-y-1.5">
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="Create a password"
          error={passwordError}
          isError={!!passwordError}
          disabled={isPending}
          required
          {...form.register("password")}
        />

        {/* Password Strength Checklist */}
        <PasswordStrength
          password={passwordValue}
          requirements={requirements}
        />

        <InlineError
          message={passwordError || ""}
          isVisible={!!passwordError}
        />
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="block text-label-md font-semibold text-on-surface flex items-center gap-1"
        >
          Confirm Password <span className="text-error" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            className="w-full h-11 pl-3.5 pr-11 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            required
            {...form.register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            disabled={isPending}
            className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            aria-pressed={showConfirmPassword}
          >
            <span
              className="material-symbols-outlined text-[19px]"
              aria-hidden="true"
            >
              {showConfirmPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        <InlineError
          message={confirmPasswordError || ""}
          isVisible={!!confirmPasswordError}
        />
      </div>

      {/* Academic Honor Code Checkbox */}
      <div className="pt-1.5">
        <div className="flex items-start gap-3">
          <input
            id="honorCode"
            type="checkbox"
            className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant focus:ring-offset-0 cursor-pointer mt-0.5"
            {...form.register("honorCode")}
          />
          <label
            htmlFor="honorCode"
            className="text-body-sm text-on-surface-variant leading-tight cursor-pointer"
          >
            I agree to the
            <Link
              href="#"
              className="text-primary hover:underline font-medium"
            >
              Academic Honor Code
            </Link>
            and
            <Link
              href="#"
              className="text-primary hover:underline font-medium"
            >
              Terms of Submission
            </Link>
          </label>
        </div>
        <InlineError
          message={honorError || ""}
          isVisible={!!honorError}
        />
      </div>

      {/* Submit Button */}
      <PrimaryActionButton
        type="submit"
        isLoading={isPending}
        loadingText="Creating account..."
        icon="arrow_forward"
        iconPosition="end"
        disabled={isPending}
      >
        Create account
      </PrimaryActionButton>

      {/* SSO Options */}
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-container-high"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-container-lowest px-3 text-label-sm text-on-surface-variant font-medium tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      <SSOButtons disabled={isPending} />

      {/* Footer */}
      <AuthFooter
        primaryAction={{
          text: "Already have an account?",
          link: "/login",
          linkText: "Sign in",
        }}
        showRoutingHint
      />
    </form>
  );
}