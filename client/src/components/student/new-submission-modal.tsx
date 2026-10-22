"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProjects } from "@/hooks/use-projects";
import type { Project } from "@/lib/api/projects";
import { cn } from "@/lib/utils";

/** Form validation schema */
const submissionSchema = z.object({
  projectId: z.string().min(1, "Please select a milestone"),
  repoUrl: z
    .string()
    .min(1, "Repository URL is required")
    .url("Must be a valid URL")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Must use HTTP or HTTPS protocol" },
    )
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return (
            parsed.hostname === "github.com" ||
            parsed.hostname === "www.github.com"
          );
        } catch {
          return false;
        }
      },
      { message: "Must be a GitHub URL (github.com)" },
    ),
  branch: z.string().min(1, "Branch is required"),
  commitSha: z.string().optional(),
  liveUrl: z
    .string()
    .optional()
    .refine(
      (url) =>
        !url ||
        url === "" ||
        (() => {
          try {
            const u = new URL(url);
            return u.protocol === "http:" || u.protocol === "https:";
          } catch {
            return false;
          }
        })(),
      { message: "Must be a valid URL" },
    ),
});

export type NewSubmissionFormValues = z.infer<typeof submissionSchema>;

export interface NewSubmissionModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void;
  /** Callback when form is submitted */
  onSubmit: (values: NewSubmissionFormValues) => void;
  /** True while submission is in progress */
  isSubmitting?: boolean;
  /** Pre-selected project ID (optional) */
  defaultProjectId?: string;
}

/**
 * Modal dialog for creating a new submission.
 *
 * Includes form fields for milestone selection, repository URL,
 * branch, commit SHA, and optional live URL.
 */
export function NewSubmissionModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  defaultProjectId,
}: NewSubmissionModalProps) {
  const { data: projects = [], isPending: isCatalogPending } = useProjects();

  const form = useForm<NewSubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      projectId: defaultProjectId || "",
      repoUrl: "",
      branch: "main",
      commitSha: "",
      liveUrl: "",
    },
  });

  const handleSubmit = (values: NewSubmissionFormValues) => {
    onSubmit(values);
    form.reset({
      projectId: defaultProjectId || "",
      repoUrl: "",
      branch: "main",
      commitSha: "",
      liveUrl: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
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
          className=" flex flex-col gap-4"
        >
          {/* Target Milestone */}
          <Field>
            <FieldLabel htmlFor="projectId">Target Milestone</FieldLabel>
            <select
              id="projectId"
              className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isCatalogPending}
              {...form.register("projectId")}
            >
              <option value="">Select a milestone</option>
              {isCatalogPending ? (
                <option disabled>Loading catalog…</option>
              ) : (
                projects.map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.id}: {project.name}
                  </option>
                ))
              )}
            </select>
            <FieldError errors={[form.formState.errors.projectId]} />
          </Field>

          {/* Git Repository URL */}
          <Field>
            <FieldLabel htmlFor="repoUrl">
              Git Repository URL
              <span
                className="text-error font-sans font-bold"
                aria-hidden="true"
              >
                *
              </span>
            </FieldLabel>

            {/* <Input
                id="repoUrl"
                type="url"
                placeholder="https://github.com/username/project-name"
                className="w-full h-10 bg-transparent text-on-surface font-code-sm text-code-sm focus:outline-none"
                {...form.register("repoUrl")}
              /> */}
            <Input
              id="repoUrl"
              type="url"
              inputMode="url"
              className="pl-9 border-surface-container-high border"
              placeholder="https://github.com/username/project-name"
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
            <FieldError errors={[form.formState.errors.repoUrl]} />
          </Field>

          {/* <Field data-invalid={!!errors.repoUrl}>
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
          </Field> */}

          {/* Git Branch & Commit SHA */}
          {/* <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="branch">
                Git Branch
                <span
                  className="text-error font-sans font-bold"
                  aria-hidden="true"
                >
                  *
                </span>
              </FieldLabel>
              <Input
                id="branch"
                type="text"
                className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-code-sm text-code-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                {...form.register("branch")}
              />
              <FieldError errors={[form.formState.errors.branch]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="commitSha">Commit SHA</FieldLabel>
              <Input
                id="commitSha"
                type="text"
                placeholder="e.g. 7f81b32"
                className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-code-sm text-code-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                {...form.register("commitSha")}
              />
              <FieldDescription>
                Optional: specific commit to submit
              </FieldDescription>
            </Field>
          </div> */}

          {/* Staging / Deployed URL */}
          <Field>
            <FieldLabel htmlFor="liveUrl">
              Staging / Deployed URL (Optional)
            </FieldLabel>
            <Input
              id="liveUrl"
              type="url"
              placeholder="https://gateway-preview.internal.assessment.run"
              className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...form.register("liveUrl")}
            />
            <FieldDescription>
              Provide the deployed, publicly accessible version of your
              application.
            </FieldDescription>
            <FieldError errors={[form.formState.errors.liveUrl]} />
          </Field>

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
