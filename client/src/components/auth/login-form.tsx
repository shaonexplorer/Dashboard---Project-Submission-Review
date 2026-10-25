"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/hooks/use-auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui";
import {
  PasswordInput,
  ErrorBanner,
  PrimaryActionButton,
  SSOButtons,
  AuthFooter,
} from "@/components/auth";

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    login(data, {
      onError: (error) => {
        setServerError(error.message || "Login failed. Please try again.");
      },
    });
  }

  const isError = !!serverError;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      {/* Card Header */}
      <div className="space-y-1.5">
        <h2 className="text-headline-lg text-on-surface font-semibold tracking-tight">
          Welcome back
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Sign in to continue to your student or mentor workspace.
        </p>
      </div>

      {/* Global Error Banner */}
      <ErrorBanner
        message={serverError || ""}
        title="Invalid credentials"
        isVisible={isError}
      />

      {/* Email Field */}
      <Input
        id="email"
        type="email"
        label="Email Address"
        placeholder="you@university.edu"
        error={emailError}
        isError={!!emailError}
        disabled={isPending}
        required
        className="border-surface-container-high border"
        leadingIcon={
          <span
            className="material-symbols-outlined text-[18px]"
            aria-hidden="true"
          >
            alternate_email
          </span>
        }
        {...form.register("email")}
      />

      {/* Password Field */}
      <PasswordInput
        id="password"
        label="Password"
        placeholder="Enter your security password"
        error={passwordError}
        isError={!!passwordError}
        disabled={isPending}
        className="border-surface-container-high border"
        required
        {...form.register("password")}
      />

      {/* Remember Me & Security Meta */}
      <div className="flex items-center justify-between pt-1">
        <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer select-none">
          <input
            id="remember-me"
            type="checkbox"
            className="w-4 h-4 rounded text-primary focus:ring-0 bg-surface-container-lowest"
            defaultChecked
          />
          <span className="text-body-sm text-on-surface-variant">
            Remember device for 30 days
          </span>
        </label>
        <span className="text-code-sm text-on-surface-variant hidden sm:inline">
          SSO TLS-Active
        </span>
      </div>

      {/* Submit Button */}
      <PrimaryActionButton
        type="submit"
        isLoading={isPending}
        loadingText="Signing in..."
        icon="login"
        disabled={isPending}
      >
        Sign in
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
        secondaryAction={{
          text: "Don't have an account?",
          link: "/auth?tab=signup",
          linkText: "Create student account",
        }}
        showRoutingHint
      />
    </form>
  );
}