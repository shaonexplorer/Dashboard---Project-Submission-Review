import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as React from "react";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Check if a React node contains only icon content (no text).
 * Used to warn about icon-only buttons missing accessible names.
 */
function isIconOnly(children: React.ReactNode): boolean {
  if (!children) return true;
  if (typeof children === "string" || typeof children === "number") {
    return children.toString().trim() === "";
  }
  if (React.isValidElement(children)) {
    // If it's a single element with no text children, it's likely icon-only
    const childChildren = (children.props as { children?: React.ReactNode })
      .children;
    if (!childChildren) return true;
    if (typeof childChildren === "string") {
      return childChildren.trim() === "";
    }
    if (Array.isArray(childChildren)) {
      return childChildren.every(
        (c) => typeof c === "object" && c !== null && React.isValidElement(c),
      );
    }
    return isIconOnly(childChildren);
  }
  if (Array.isArray(children)) {
    return children.every((c) => isIconOnly(c));
  }
  return false;
}

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  "aria-label": ariaLabel,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // Development warning for icon-only buttons without accessible name
  if (process.env.NODE_ENV !== "production") {
    const isIconSize =
      size != null && ["icon", "icon-xs", "icon-sm", "icon-lg"].includes(size);
    const hasNoText = isIconOnly(children);
    const hasNoAriaLabel = !ariaLabel && !props["aria-labelledby"];

    if (isIconSize && hasNoText && hasNoAriaLabel) {
      console.warn(
        `[Accessibility] Button with size="${size}" appears to be icon-only but lacks an aria-label or aria-labelledby. ` +
          `Add aria-label="..." to provide an accessible name for screen readers.`,
      );
    }
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
