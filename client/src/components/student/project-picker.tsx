"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Project } from "@/lib/api/projects";
import type { Submission } from "@/lib/api/submissions";
import { cn } from "@/lib/utils";

/**
 * The state a catalog entry is in, from the student's point of view.
 *
 * The state is derived from the student's own submission for that project, so
 * the picker can say *why* an entry cannot be picked instead of silently
 * greying it out.
 */
export type ProjectOptionState =
  /** Nothing handed in for this project yet. */
  | "available"
  /** Handed in and still waiting for a mentor. */
  | "in-review"
  /** Handed in and approved. */
  | "approved"
  /** Handed in and rejected — the student has to resubmit, not submit. */
  | "rejected";

/** A catalog entry joined with the student's own submission for it. */
export interface ProjectPickerOption {
  project: Project;
  /** The student's own submission for this project, when there is one. */
  submission?: Submission;
  /** The state the option is in. */
  state: ProjectOptionState;
}

/**
 * How each state is presented.
 *
 * The label is always spelled out: the icon and the colour only reinforce
 * what the text already says, so the state never depends on colour alone.
 */
const OPTION_STATE: Record<
  ProjectOptionState,
  { label: string; icon: string; className: string }
> = {
  available: {
    label: "Available to submit",
    icon: "assignment",
    className: "text-secondary",
  },
  "in-review": {
    label: "Already submitted · in review",
    icon: "schedule",
    className: "text-secondary",
  },
  approved: {
    label: "Already submitted · approved",
    icon: "check_circle",
    className: "text-secondary",
  },
  rejected: {
    label: "Rejected · resubmit from your submissions",
    icon: "cancel",
    className: "text-error",
  },
};

/**
 * Derives the state of a catalog entry from the student's own submissions.
 *
 * The status the server reports wins over anything the client remembers: a
 * submission that is in review is in review, whatever the catalog says.
 */
export function getProjectOptionState(
  submission: Submission | undefined
): ProjectOptionState {
  if (!submission) {
    return "available";
  }

  if (submission.status === "APPROVED") {
    return "approved";
  }

  if (submission.status === "REJECTED") {
    return "rejected";
  }

  return "in-review";
}

/**
 * Joins the catalog with the student's own submissions.
 *
 * The result is ordered the way the catalog is — by name — so the list never
 * reorders itself as the student's own submissions change.
 */
export function buildProjectOptions(
  projects: Project[],
  submissions: Submission[]
): ProjectPickerOption[] {
  return projects.map((project) => {
    const submission = submissions.find((item) => item.projectId === project.id);

    return {
      project,
      submission,
      state: getProjectOptionState(submission),
    };
  });
}

export interface ProjectPickerProps {
  /** The id of the control, so the field label can point at it. */
  id: string;
  /** The selected catalog code. Empty when nothing has been picked yet. */
  value: string;
  /** Called with the catalog code of the chosen project. */
  onChange: (projectId: string) => void;
  /** The catalog, with the student's own state joined onto each entry. */
  options: ProjectPickerOption[];
  /** True while the catalog is still loading. */
  isLoading?: boolean;
  /** The catalog load failure, when there is one. */
  loadError?: string | null;
  /** Retries the catalog request. */
  onRetry?: () => void;
  /** The validation message for the current value. */
  error?: string;
  /** Disables the control. */
  disabled?: boolean;
}

/**
 * The project picker.
 *
 * The student picks a project from the server-provided catalog instead of
 * typing a name. The codebase has no `Select` or `Popover` primitive, so the
 * picker is composed from the pieces that do exist: a `Button` trigger that
 * opens a `Dialog` with a search `Input` and a list of catalog options.
 *
 * Keyboard operation is the same as anywhere else in the app: the trigger is
 * a button, so it is focusable and opens on Enter and Space; the dialog traps
 * focus; and every option is a button, so the list is reachable and
 * selectable without a pointer.
 *
 * The selected project is part of the trigger's accessible name, so a
 * screen-reader user can tell which project is selected without opening the
 * list.
 */
export function ProjectPicker({
  id,
  value,
  onChange,
  options,
  isLoading = false,
  loadError = null,
  onRetry,
  error,
  disabled = false,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((option) => option.project.id === value);

  const visibleOptions = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return options;
    }

    return options.filter(({ project }) =>
      [project.id, project.name, project.description ?? ""].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [options, search]);

  function selectOption(projectId: string) {
    onChange(projectId);
    setOpen(false);
    setSearch("");
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>
        Project
        <span className="text-error font-sans font-bold" aria-hidden="true">
          *
        </span>
      </FieldLabel>

      <Dialog open={open} onOpenChange={setOpen}>
        {/*
          The trigger stays operable while the catalog is loading or has
          failed. Disabling it would hide the very state the student needs to
          see — the loading indicator, the failure and the retry — behind a
          control that cannot be opened.
        */}
        <DialogTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              className={cn(
                "h-auto min-h-10 w-full justify-between gap-2 px-3.5 py-2.5",
                "border-surface-container-high bg-surface-container-lowest",
                "text-left font-body-md text-body-md font-normal",
                !selected && !isLoading && "text-outline",
              )}
            />
          }
        >
          {isLoading ? (
            <span className="flex min-w-0 items-center gap-2 text-on-surface-variant">
              <Spinner data-icon="inline-start" />
              Loading the project catalog…
            </span>
          ) : selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="font-code-sm text-code-sm font-semibold uppercase text-secondary">
                {selected.project.id}
              </span>
              <span className="truncate text-on-surface">
                {selected.project.name}
              </span>
            </span>
          ) : (
            <span>Select a project from the catalog</span>
          )}

          <span
            className="material-symbols-outlined text-[18px] text-outline"
            data-icon="inline-end"
            aria-hidden="true"
          >
            expand_more
          </span>
        </DialogTrigger>

        <DialogContent className="max-w-xl gap-0 p-0">
          <DialogHeader className="flex-row items-start gap-3 space-y-0 bg-surface-container-low px-6 py-4">
            <span
              className="material-symbols-outlined text-primary text-[20px]"
              aria-hidden="true"
            >
              assignment
            </span>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-headline-sm text-on-surface">
                Select a project
              </DialogTitle>
              <DialogDescription className="text-body-sm text-on-surface-variant">
                One submission per project. A project that came back rejected is
                resubmitted from your submissions list.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4 p-6">
            <Input
              id={`${id}-search`}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code, name or brief"
              aria-label="Search the project catalog"
              leadingIcon={
                <span
                  className="material-symbols-outlined text-[18px]"
                  aria-hidden="true"
                >
                  search
                </span>
              }
            />

            {isLoading || loadError ? (
              <CatalogStatus
                isLoading={isLoading}
                loadError={loadError}
                onRetry={onRetry}
              />
            ) : visibleOptions.length === 0 ? (
              <p className="px-3 py-6 text-body-sm text-on-surface-variant">
                {search.trim()
                  ? "No project matches your search."
                  : "The project catalog is empty. Ask a mentor to seed it."}
              </p>
            ) : (
              <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                {visibleOptions.map((option) => (
                  <li key={option.project.id}>
                    <ProjectOptionButton
                      option={option}
                      isSelected={option.project.id === value}
                      onSelect={() => selectOption(option.project.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/*
        The catalog state is also rendered outside the dialog. A student who
        never opens the list must still see that the catalog failed to load,
        and must be offered the retry, rather than discovering it as a
        validation error on submit.
      */}
      {isLoading || loadError ? (
        <CatalogStatus
          isLoading={isLoading}
          loadError={loadError}
          onRetry={onRetry}
        />
      ) : null}

      <FieldDescription>
        The project name is written by the server from the catalog, so it always
        matches the entry you picked.
      </FieldDescription>
      <FieldError id={`${id}-error`} errors={error ? [{ message: error }] : []} />
    </Field>
  );
}

/**
 * The catalog's loading and failure states.
 *
 * The two states are announced rather than merely drawn: the loading state
 * carries `role="status"` and the failure carries `role="alert"`, so a
 * screen-reader user hears that the catalog is unavailable instead of
 * finding an empty control.
 */
function CatalogStatus({
  isLoading,
  loadError,
  onRetry,
}: {
  isLoading: boolean;
  loadError: string | null;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 px-3 py-4 text-body-sm text-on-surface-variant"
      >
        <Spinner data-icon="inline-start" />
        Loading the project catalog…
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-lg bg-error-container/40 px-4 py-4"
      >
        <p className="text-body-sm text-on-surface">{loadError}</p>
        {onRetry ? (
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  }

  return null;
}

/**
 * A single catalog entry in the picker's list.
 *
 * The button carries the state as text, so the option is understandable
 * without relying on the icon or the colour. A project that is already under
 * review or approved cannot be picked again; a rejected one can be, because
 * the server answers that case with a pointer to the resubmission path.
 */
function ProjectOptionButton({
  option,
  isSelected,
  onSelect,
}: {
  option: ProjectPickerOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { project, submission, state } = option;
  const meta = OPTION_STATE[state];
  const isUnavailable = state === "in-review" || state === "approved";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onSelect}
      disabled={isUnavailable}
      aria-pressed={isSelected}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "h-auto w-full items-start justify-start gap-3 px-3.5 py-3",
        "border-surface-container-high bg-surface-container-lowest",
        "text-left font-normal",
        isSelected && "border-primary bg-primary-container/20",
        isUnavailable && "opacity-70",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="font-code-sm text-code-sm font-semibold uppercase text-secondary">
            {project.id}
          </span>
          <span className="truncate text-headline-sm text-on-surface font-semibold">
            {project.name}
          </span>
        </span>

        {project.description ? (
          <span className="line-clamp-2 text-body-sm text-secondary">
            {project.description}
          </span>
        ) : null}

        <span className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 font-label-sm text-label-sm",
              meta.className,
            )}
          >
            <span
              className="material-symbols-outlined text-[15px]"
              aria-hidden="true"
            >
              {meta.icon}
            </span>
            {meta.label}
          </span>

          {submission ? (
            <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm">
              Attempt {submission.attempt}
            </span>
          ) : null}
        </span>
      </span>

      {isSelected ? (
        <span
          className="material-symbols-outlined text-primary text-[18px]"
          aria-hidden="true"
        >
          check_circle
        </span>
      ) : null}
    </Button>
  );
}
