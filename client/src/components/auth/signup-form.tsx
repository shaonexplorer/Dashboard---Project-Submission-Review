"use client";

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
} from "@/components/auth";
import React from "react";

export function SignupForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const { mutate: signup, isPending } = useSignup();

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
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      {/* Card Header */}
      <div className="space-y-1.5  ">
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
          label="Password"
          placeholder="Create a password"
          error={passwordError}
          isError={!!passwordError}
          disabled={isPending}
          required
          {...form.register("password")}
        />

        {/* Password Strength Checklist */}
        {/* <PasswordStrength
          password={passwordValue}
          requirements={requirements}
        /> */}

        {/* <InlineError
          message={passwordError || ""}
          isVisible={!!passwordError}
        /> */}
      </div>

      {/* Confirm Password Field */}
      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm your password"
        error={confirmPasswordError}
        isError={!!confirmPasswordError}
        disabled={isPending}
        required
        {...form.register("confirmPassword")}
      />

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
              className="text-primary hover:underline font-medium m-0.5"
            >
              Academic Honor Code
            </Link>
            and
            <Link
              href="#"
              className="text-primary hover:underline font-medium m-0.5"
            >
              Terms of Submission
            </Link>
          </label>
        </div>
        <InlineError message={honorError || ""} isVisible={!!honorError} />
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
          link: "/auth?tab=login",
          linkText: "Sign in",
        }}
        showRoutingHint
      />
    </form>
  );
}
