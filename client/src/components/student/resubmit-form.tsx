"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useResubmitSubmission } from "@/hooks/use-submissions";
import { ApiRequestError } from "@/lib/api/client";
import { SUBMISSION_ERROR_CODES, type Submission } from "@/lib/api/submissions";
import {
  DESCRIPTION_MAX_LENGTH,
  resubmitSchema,
  type ResubmitFormValues,
} from "@/lib/validations/submission";

/** Field names the server may report validation errors for. */
const RESUBMIT_FIELDS = ["repoUrl", "liveUrl", "description"] as const;

type ResubmitField = (typeof RESUBMIT_FIELDS)[number];

/**
 * The resubmission form.
 *
 * A resubmission reuses the existing row, so the form only replaces the
 * deliverable: the repository, the live link and the description. The project
 * is deliberately absent — a resubmission always stays on the project the
 * submission was made for.
 *
 * The previous attempt's values are pre-filled, because the student is
 * working against the mentor's notes rather than starting from a blank
 * page, and the notes stay on screen while the form is open.
 */
export function ResubmitForm({ submission }: { submission: Submission }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { mutate: resubmit, isPending } = useResubmitSubmission();

  const form = useForm<ResubmitFormValues>({
    resolver: zodResolver(resubmitSchema),
    defaultValues: {
      repoUrl: submission.repoUrl,
      liveUrl: submission.liveUrl ?? "",
      description: submission.description,
    },
  });

  const { errors } = form.formState;
  const previousNotes = submission.feedback?.trim() ?? "";

  function handleError(error: unknown) {
    if (!(error instanceof ApiRequestError)) {
      setServerError(
        "We could not submit your changes right now. Please try again.",
      );
      return;
    }

    switch (error.status) {
      case 400: {
        const mapped = error.fieldErrors.filter((fieldError) =>
          (RESUBMIT_FIELDS as readonly string[]).includes(fieldError.field),
        );

        mapped.forEach((fieldError) => {
          form.setError(fieldError.field as ResubmitField, {
            type: "server",
            message: fieldError.message,
          });
        });

        setServerError(
          mapped.length > 0
            ? "Some details could not be accepted. Please review the highlighted fields."
            : error.message,
        );
        break;
      }
      case 404:
        setServerError(
          "This submission could not be found. It may have been removed.",
        );
        break;
      case 409:
        // The submission is no longer rejected, so there is nothing to
        // resubmit.
        setServerError(
          error.code === SUBMISSION_ERROR_CODES.NOT_RESUBMITTABLE
            ? "This submission is no longer awaiting changes."
            : error.message,
        );
        break;
      case 429:
        setServerError("Too many submission attempts. Please try again later.");
        break;
      default:
        setServerError(
          "Something went wrong on our side. Please try again in a moment.",
        );
    }
  }

  function onSubmit(values: ResubmitFormValues) {
    setServerError(null);

    resubmit(
      { submissionId: submission.id, payload: values },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Resubmission received", {
            description: `Attempt ${submission.attempt + 1} is queued for mentor review.`,
          });
        },
        onError: handleError,
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="secondary"
            className="px-4 text-label-md shadow-sm"
          />
        }
      >
        <span
          className="material-symbols-outlined text-[16px]"
          data-icon="inline-start"
          aria-hidden="true"
        >
          sync
        </span>
        Resubmit
      </DialogTrigger>

      <DialogContent className="max-w-xl gap-0 p-0">
        <DialogHeader className="flex-row items-start gap-3 space-y-0 bg-surface-container-low px-6 py-4 text-left">
          <span
            className="material-symbols-outlined text-primary text-[20px]"
            aria-hidden="true"
          >
            sync
          </span>
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-headline-sm text-on-surface">
              Resubmit {submission.projectName}
            </DialogTitle>
            <DialogDescription className="text-body-sm text-on-surface-variant">
              Your changes replace the previous deliverable on this project.
              The attempt number goes up and the submission goes back into the
              review queue.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4 p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-code-sm text-code-sm font-semibold uppercase text-secondary">
              {submission.projectId}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm">
              Attempt {submission.attempt} → Attempt {submission.attempt + 1}
            </span>
          </div>

          {/* The previous attempt's notes stay on screen: they are what the
              student is working against. */}
          {previousNotes ? (
            <div className="relative rounded-r-lg bg-surface-container-low/70 py-4 pl-10 pr-4">
              <div
                className="absolute bottom-0 left-0 top-0 w-1.5 rounded-l bg-error"
                aria-hidden="true"
              />
              <span className="font-code-sm text-code-sm uppercase tracking-wider text-secondary">
                Previous attempt notes
              </span>
              <p className="text-body-sm text-on-surface whitespace-pre-line">
                {previousNotes}
              </p>
            </div>
          ) : null}

          {serverError ? (
            <Alert
              variant="destructive"
              className="bg-error-container text-on-error-container border-error-container"
            >
              <AlertTitle className="text-headline-sm">
                Resubmission could not be completed
              </AlertTitle>
              <AlertDescription className="text-body-sm text-on-error-container">
                {serverError}
              </AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field data-invalid={!!errors.repoUrl}>
              <FieldLabel htmlFor="resubmit-repoUrl">
                GitHub Repository
                <span className="text-error font-sans font-bold" aria-hidden="true">
                  *
                </span>
              </FieldLabel>
              <Input
                id="resubmit-repoUrl"
                type="url"
                inputMode="url"
                className="pl-9 border-surface-container-high border"
                placeholder="https://github.com/username/project-name"
                isError={!!errors.repoUrl}
                aria-invalid={!!errors.repoUrl}
                aria-describedby={errors.repoUrl ? "resubmit-repoUrl-error" : undefined}
                disabled={isPending}
                leadingIcon={
                  <span
                    className="material-symbols-outlined text-[18px]"
                    aria-hidden="true"
                  >
                    code
                  </span>
                }
                {...form.register("repoUrl")}
              />
              <FieldDescription>
                Point this at the commit that answers the mentor&apos;s notes.
              </FieldDescription>
              <FieldError
                id="resubmit-repoUrl-error"
                errors={[errors.repoUrl]}
              />
            </Field>

            <Field data-invalid={!!errors.liveUrl}>
              <FieldLabel htmlFor="resubmit-liveUrl">
                Live Project
                <span className="text-error font-sans font-bold" aria-hidden="true">
                  *
                </span>
              </FieldLabel>
              <Input
                id="resubmit-liveUrl"
                type="url"
                inputMode="url"
                className="pl-9 border-surface-container-high border"
                placeholder="https://orchestrator-app.vercel.app"
                isError={!!errors.liveUrl}
                aria-invalid={!!errors.liveUrl}
                aria-describedby={errors.liveUrl ? "resubmit-liveUrl-error" : undefined}
                disabled={isPending}
                leadingIcon={
                  <span
                    className="material-symbols-outlined text-[18px]"
                    aria-hidden="true"
                  >
                    rocket_launch
                  </span>
                }
                {...form.register("liveUrl")}
              />
              <FieldDescription>
                Make sure the deployment matches the submitted commit.
              </FieldDescription>
              <FieldError
                id="resubmit-liveUrl-error"
                errors={[errors.liveUrl]}
              />
            </Field>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="resubmit-description">
                Description
                <span className="text-error font-sans font-bold" aria-hidden="true">
                  *
                </span>
              </FieldLabel>
              <Textarea
                id="resubmit-description"
                rows={5}
                className="min-h-32 resize-y bg-surface-container-lowest border-surface-container-high text-on-surface text-body-md placeholder:text-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                placeholder="Describe what changed since the previous attempt…"
                maxLength={DESCRIPTION_MAX_LENGTH}
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description ? "resubmit-description-error" : undefined
                }
                disabled={isPending}
                {...form.register("description")}
              />
              <FieldDescription>
                Up to {DESCRIPTION_MAX_LENGTH} characters. Markdown is supported.
              </FieldDescription>
              <FieldError
                id="resubmit-description-error"
                errors={[errors.description]}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="px-4 text-label-md">
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Submitting…
                </>
              ) : (
                <>
                  Resubmit
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
