"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useProjects } from "@/hooks/use-projects";
import { useMySubmissions } from "@/hooks/use-submissions";
import type { Project } from "@/lib/api/projects";
import {
  DESCRIPTION_MAX_LENGTH,
  submissionSchema,
  type SubmissionFormValues,
} from "@/lib/validations/submission";

export type NewSubmissionFormValues = SubmissionFormValues;

export interface NewSubmissionModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void;
  /** Callback when form is submitted */
  onSubmit: (values: SubmissionFormValues) => void;
  /** True while submission is in progress */
  isSubmitting?: boolean;
  /** Pre-selected project ID (optional) */
  defaultProjectId?: string;
}

/**
 * Modal dialog for creating a new submission.
 *
 * Includes form fields for project selection, repository URL,
 * live URL, and description.
 */
export function NewSubmissionModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  defaultProjectId,
}: NewSubmissionModalProps) {
  const { data: projects = [], isPending: isCatalogPending } = useProjects();
  const { data: mySubmissions = [] } = useMySubmissions();

  // Collect project IDs that already have a submission (PENDING or APPROVED).
  // Rejected submissions are handled via the resubmit flow, so they remain
  // available in the new-submission picker only if the student wants to start
  // fresh — but the backend will reject a duplicate create, so we disable them
  // here as well for a better UX.
  const submittedProjectIds = new Set(
    mySubmissions
      .filter((s) => s.status !== "REJECTED")
      .map((s) => s.projectId),
  );

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      projectId: defaultProjectId || "",
      repoUrl: "",
      liveUrl: "",
      description: "",
    },
  });

  const { errors } = form.formState;
  const description = useWatch({ control: form.control, name: "description" });
  const descriptionLength = description?.length ?? 0;
  const isDisabled = isSubmitting;

  const handleSubmit = (values: SubmissionFormValues) => {
    onSubmit(values);
    form.reset({
      projectId: defaultProjectId || "",
      repoUrl: "",
      liveUrl: "",
      description: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-xl p-4 sm:p-6">
        <DialogHeader className="my-2 flex-row items-center gap-3 space-y-0 bg-surface-container-low px-2 py-4">
          <span
            className="material-symbols-outlined text-primary text-[20px]"
            aria-hidden="true"
          >
            upload_file
          </span>
          <div>
            <DialogTitle className="font-headline-sm text-headline-sm text-on-surface">
              Submit Deliverable
            </DialogTitle>
          </div>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          noValidate
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            {/* Target Milestone */}
            <Field data-invalid={!!errors.projectId}>
              <FieldLabel htmlFor="projectId">Target Milestone</FieldLabel>
              <select
                id="projectId"
                className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isCatalogPending || isDisabled}
                {...form.register("projectId")}
              >
                <option value="">Select a milestone</option>
                {isCatalogPending ? (
                  <option disabled>Loading catalog…</option>
                ) : (
                  projects.map((project: Project) => (
                    <option
                      key={project.id}
                      value={project.id}
                      disabled={submittedProjectIds.has(project.id)}
                    >
                      {project.id}: {project.name}
                      {submittedProjectIds.has(project.id) && " (Submitted)"}
                    </option>
                  ))
                )}
              </select>
              <FieldError errors={[errors.projectId]} />
            </Field>

            {/* Git Repository URL */}
            <Field data-invalid={!!errors.repoUrl}>
              <FieldLabel htmlFor="repoUrl">
                GitHub Repository
                <span
                  className="text-error font-sans font-bold"
                  aria-hidden="true"
                >
                  *
                </span>
              </FieldLabel>
              <Input
                id="repoUrl"
                type="url"
                inputMode="url"
                className="pl-9 border-surface-container-high border"
                placeholder="https://github.com/username/project-name"
                isError={!!errors.repoUrl}
                aria-invalid={!!errors.repoUrl}
                aria-describedby={errors.repoUrl ? "repoUrl-error" : undefined}
                disabled={isDisabled}
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
                Provide the public GitHub repository containing your project
                source code.
              </FieldDescription>
              <FieldError id="repoUrl-error" errors={[errors.repoUrl]} />
            </Field>

            {/* Live Project URL */}
            <Field data-invalid={!!errors.liveUrl}>
              <FieldLabel htmlFor="liveUrl">
                Live Project
                <span
                  className="text-error font-sans font-bold"
                  aria-hidden="true"
                >
                  *
                </span>
              </FieldLabel>
              <Input
                id="liveUrl"
                type="url"
                inputMode="url"
                className="pl-9 border-surface-container-high border"
                placeholder="https://orchestrator-app.vercel.app"
                isError={!!errors.liveUrl}
                aria-invalid={!!errors.liveUrl}
                aria-describedby={errors.liveUrl ? "liveUrl-error" : undefined}
                disabled={isDisabled}
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
                Provide the deployed, publicly accessible version of your
                application.
              </FieldDescription>
              <FieldError id="liveUrl-error" errors={[errors.liveUrl]} />
            </Field>

            {/* Description */}
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="description">
                Description
                <span
                  className="text-error font-sans font-bold"
                  aria-hidden="true"
                >
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
                hint="Up to {DESCRIPTION_MAX_LENGTH} characters. Markdown is supported."
                hintId="description-hint"
                disabled={isDisabled}
                {...form.register("description")}
              />
              <div className="flex items-center justify-between px-0.5" id="description-hint" aria-hidden="true">
                <span className="text-body-sm text-secondary">
                  Up to {DESCRIPTION_MAX_LENGTH} characters. Markdown is
                  supported.
                </span>
                <span className="text-code-sm text-secondary font-medium">
                  {descriptionLength} / {DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <FieldError
                id="description-error"
                errors={[errors.description]}
              />
            </Field>
          </FieldGroup>

          {/* Certification */}
          <div className="p-3 rounded-lg bg-surface-container flex items-start gap-3">
            <span
              className="material-symbols-outlined text-secondary text-[18px] mt-0.5"
              aria-hidden="true"
            >
              verified_user
            </span>
            <p className="font-body-sm text-body-sm text-secondary">
              By submitting, you certify that all source commits comply with
              ProjectHub Code Integrity Standards and Academic Honor Code.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg font-label-md text-label-md bg-primary-container text-on-primary hover:bg-primary transition-colors shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Submitting…
                </>
              ) : (
                <>
                  Confirm & Queue Checks
                  <span
                    className="material-symbols-outlined text-[18px]"
                    aria-hidden="true"
                  >
                    arrow_forward
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
