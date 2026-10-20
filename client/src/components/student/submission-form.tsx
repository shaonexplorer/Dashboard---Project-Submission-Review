"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCreateSubmission } from "@/hooks/use-submissions";
import { ApiRequestError } from "@/lib/api/client";
import {
  DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  submissionSchema,
  type SubmissionFormValues,
} from "@/lib/validations/submission";

/** Field names the server may report validation errors for. */
const SUBMISSION_FIELDS = [
  "projectName",
  "repoUrl",
  "liveUrl",
  "description",
] as const;

type SubmissionField = (typeof SUBMISSION_FIELDS)[number];

/**
 * Project submission form.
 *
 * React Hook Form owns the field state, Zod validates it and TanStack Query
 * owns the request. The server remains the source of truth: a successful
 * response is what replaces this form with the submitted-project view.
 */
export function StudentSubmissionForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const { mutate: createSubmission, isPending } = useCreateSubmission();

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      projectName: "",
      repoUrl: "",
      liveUrl: "",
      description: "",
    },
  });

  const { errors } = form.formState;
  const description = useWatch({ control: form.control, name: "description" });
  const descriptionLength = description?.length ?? 0;
  const isDisabled = isPending || isForbidden;

  function handleError(error: unknown) {
    if (!(error instanceof ApiRequestError)) {
      setServerError(
        "We could not submit your project right now. Please try again."
      );
      return;
    }

    switch (error.status) {
      case 400: {
        // Surface structured field errors on the matching inputs.
        const mapped = error.fieldErrors.filter((fieldError) =>
          (SUBMISSION_FIELDS as readonly string[]).includes(fieldError.field)
        );

        mapped.forEach((fieldError) => {
          form.setError(fieldError.field as SubmissionField, {
            type: "server",
            message: fieldError.message,
          });
        });

        setServerError(
          mapped.length > 0
            ? "Some details could not be accepted. Please review the highlighted fields."
            : error.message
        );
        break;
      }
      case 401:
        setServerError("Your session has expired. Redirecting you to sign in…");
        router.replace("/auth?tab=login&redirectTo=/student/dashboard");
        break;
      case 403:
        setIsForbidden(true);
        setServerError("Only student accounts can submit a project.");
        break;
      case 409:
        // The mine query is invalidated by the mutation, so the dashboard
        // re-syncs with the server and shows the existing submission.
        setServerError(
          "You have already submitted a project. Loading your submission…"
        );
        break;
      case 429:
        setServerError(
          "Too many submission attempts. Please try again later."
        );
        break;
      default:
        setServerError(
          "Something went wrong on our side. Please try again in a moment."
        );
    }
  }

  function onSubmit(values: SubmissionFormValues) {
    setServerError(null);
    setIsForbidden(false);

    createSubmission(values, {
      onSuccess: () => {
        toast.success("Project submitted successfully", {
          description: "Your submission is now queued for mentor review.",
        });
      },
      onError: handleError,
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 p-6 sm:p-7 flex flex-col gap-6"
    >
      {/* Card Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-surface-container-high/60">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm text-on-surface font-bold tracking-tight">
            Project Details
          </h2>
          <span className="text-code-sm text-secondary flex items-center gap-1">
            <span className="text-error font-sans font-bold" aria-hidden="true">
              *
            </span>
            Mandatory fields
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Provide the repository, deployment, and project information below for
          technical validation.
        </p>
      </div>

      {/* Server error feedback */}
      {serverError && (
        <Alert variant="destructive" className="bg-error-container text-on-error-container border-error-container">
          <AlertTitle className="text-headline-sm">
            Submission could not be completed
          </AlertTitle>
          <AlertDescription className="text-body-sm text-on-error-container">
            {serverError}
          </AlertDescription>
        </Alert>
      )}

      {/* Form Fields */}
      <FieldGroup>
        {/* 1. Project Name */}
        <Field data-invalid={!!errors.projectName}>
          <FieldLabel htmlFor="projectName">
            Project Name
            <span className="text-error font-sans font-bold" aria-hidden="true">
              *
            </span>
          </FieldLabel>
          <Input
            id="projectName"
            className="pl-3.5"
            placeholder="e.g. Distributed Task Orchestrator &amp; CLI"
            maxLength={PROJECT_NAME_MAX_LENGTH}
            isError={!!errors.projectName}
            aria-invalid={!!errors.projectName}
            aria-describedby={
              errors.projectName ? "projectName-error" : undefined
            }
            disabled={isDisabled}
            {...form.register("projectName")}
          />
          <FieldDescription>
            Up to {PROJECT_NAME_MAX_LENGTH} characters. This is the title mentors
            will see.
          </FieldDescription>
          <FieldError id="projectName-error" errors={[errors.projectName]} />
        </Field>

        {/* 2. GitHub Repository */}
        <Field data-invalid={!!errors.repoUrl}>
          <FieldLabel htmlFor="repoUrl">
            GitHub Repository
            <span className="text-error font-sans font-bold" aria-hidden="true">
              *
            </span>
          </FieldLabel>
          <Input
            id="repoUrl"
            type="url"
            inputMode="url"
            className="pl-9"
            placeholder="https://github.com/username/project-name"
            isError={!!errors.repoUrl}
            aria-invalid={!!errors.repoUrl}
            aria-describedby={errors.repoUrl ? "repoUrl-error" : undefined}
            disabled={isDisabled}
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                code
              </span>
            }
            {...form.register("repoUrl")}
          />
          <FieldDescription>
            Provide the public GitHub repository containing your project source
            code.
          </FieldDescription>
          <FieldError id="repoUrl-error" errors={[errors.repoUrl]} />
        </Field>

        {/* 3. Live Project URL */}
        <Field data-invalid={!!errors.liveUrl}>
          <FieldLabel htmlFor="liveUrl">
            Live Project
            <span className="text-error font-sans font-bold" aria-hidden="true">
              *
            </span>
          </FieldLabel>
          <Input
            id="liveUrl"
            type="url"
            inputMode="url"
            className="pl-9"
            placeholder="https://orchestrator-app.vercel.app"
            isError={!!errors.liveUrl}
            aria-invalid={!!errors.liveUrl}
            aria-describedby={errors.liveUrl ? "liveUrl-error" : undefined}
            disabled={isDisabled}
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                rocket_launch
              </span>
            }
            {...form.register("liveUrl")}
          />
          <FieldDescription>
            Provide the deployed, publicly accessible version of your
            application.
          </FieldDescription>
          <FieldError id="liveUrl-error" errors={[errors.liveUrl]} />
        </Field>

        {/* 4. Description */}
        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="description">
            Description
            <span className="text-error font-sans font-bold" aria-hidden="true">
              *
            </span>
          </FieldLabel>
          <Textarea
            id="description"
            rows={5}
            className="min-h-32 resize-y bg-surface-container-lowest border-surface-container-high text-on-surface text-body-md placeholder:text-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            placeholder="Briefly describe what your application does, its core architecture, primary tech stack (e.g. Next.js, Redis, Tailwind), and key features tested…"
            maxLength={DESCRIPTION_MAX_LENGTH}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
            disabled={isDisabled}
            {...form.register("description")}
          />
          <div className="flex items-center justify-between px-0.5">
            <span className="text-body-sm text-secondary">
              Up to {DESCRIPTION_MAX_LENGTH} characters. Markdown is supported.
            </span>
            <span className="text-code-sm text-secondary font-medium">
              {descriptionLength} / {DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
          <FieldError id="description-error" errors={[errors.description]} />
        </Field>
      </FieldGroup>

      {/* Verification hooks — applied by mentors during review */}
      <div className="p-3.5 rounded-lg bg-surface-container-low/60 border border-surface-container-high/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-code-sm text-secondary uppercase tracking-wider font-medium">
            Verification Hooks
          </span>
          <span className="text-[12px] text-secondary">
            Applied by mentors during review
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-code-sm text-on-surface-variant">
          {["Git history scan", "SSL & HTTP/2 ping", "Readme compliance"].map(
            (hook) => (
              <span
                key={hook}
                className="px-2 py-1 rounded bg-surface-container-lowest border border-surface-container-high/60 flex items-center gap-1.5 shadow-sm"
              >
                <span
                  className="material-symbols-outlined text-[14px] text-primary"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                {hook}
              </span>
            )
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-surface-container-high/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 max-w-sm text-secondary">
          <span
            className="material-symbols-outlined text-[16px] shrink-0 text-outline"
            aria-hidden="true"
          >
            lock
          </span>
          <span className="text-body-sm">
            Your submission cannot be edited after it is submitted. Mentor review
            locks immediately.
          </span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={isDisabled}
            className="px-4 text-label-md shadow-sm"
          >
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Submitting…
              </>
            ) : (
              <>
                Submit Project
                <span
                  className="material-symbols-outlined text-[16px]"
                  data-icon="inline-end"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
