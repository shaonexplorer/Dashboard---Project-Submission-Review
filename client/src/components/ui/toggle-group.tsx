"use client";

import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { Toggle } from "@base-ui/react/toggle";
import { cn } from "@/lib/utils";

/**
 * A row of toggle buttons that share one selection.
 *
 * A group of two to seven options — a status filter, a view switcher — is
 * exactly what this component is for. Base UI keeps the roving focus and the
 * arrow-key navigation in place, so the group is fully operable from the
 * keyboard.
 */
function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn(
        "flex w-fit items-center gap-1 rounded-xl bg-surface-container-low p-1",
        className,
      )}
      {...props}
    />
  );
}

/**
 * One option of a {@link ToggleGroup}.
 *
 * The pressed state is expressed with `data-pressed`, so the active option is
 * told apart by its weight and colour as well as by its background.
 */
function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof Toggle>) {
  return (
    <Toggle
      data-slot="toggle-group-item"
      className={cn(
        "flex items-center gap-2 rounded-md px-4 py-1.5 font-label-md text-label-md text-on-surface-variant transition-all",
        "hover:text-on-surface",
        "data-[pressed]:bg-surface-container-lowest data-[pressed]:text-primary data-[pressed]:font-semibold data-[pressed]:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
