"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Hint text */
  hint?: string;
  /** Placeholder text */
  placeholder?: string;
  /** ID for the input */
  id: string;
  /** Name for form submission — usually supplied by the form library */
  name?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether input is required */
  required?: boolean;
  /** Whether the field is in an error state */
  isError?: boolean;
  /** Custom className */
  className?: string;
}

export function PasswordInput({
  label = "Password",
  error,
  hint,
  placeholder = "Enter your password",
  id,
  name,
  disabled,
  required,
  isError,
  className,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Input
      id={id}
      name={name}
      type={showPassword ? "text" : "password"}
      label={label}
      error={error}
      hint={hint}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      isError={isError}
      leadingIcon={
        <span
          className="material-symbols-outlined text-[18px]"
          aria-hidden="true"
        >
          lock
        </span>
      }
      trailingIcon={
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          className="text-on-surface-variant hover:text-on-surface focus:outline-none   rounded transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            aria-hidden="true"
          >
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      }
      className={className}
      {...props}
    />
  );
}
