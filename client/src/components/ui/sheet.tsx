"use client";

import * as React from "react";
import * as DialogPrimitive from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

/**
 * Side panel primitives.
 *
 * Built on the same Base UI dialog parts as `dialog.tsx`, but anchored to the
 * edge of the screen instead of the centre. The dialog handles the parts that
 * are easy to get wrong — the focus trap, the escape key, the backdrop click
 * and the `aria` wiring — so the panel only has to describe how it looks.
 */

const Sheet = DialogPrimitive.Dialog.Root;

const SheetTrigger = DialogPrimitive.Dialog.Trigger;

const SheetPortal = DialogPrimitive.Dialog.Portal;

const SheetClose = DialogPrimitive.Dialog.Close;

/** The dimmed layer behind the panel. */
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Dialog.Backdrop>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Dialog.Backdrop>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Dialog.Backdrop
    ref={ref}
    className={cn(
      // Base UI marks the opening and closing frames with `data-starting-style`
      // and `data-ending-style`, so the fade is a plain opacity transition
      // rather than a keyframe animation.
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Dialog.Backdrop.displayName;

/** Which edge of the screen the panel is anchored to. */
export type SheetSide = "left" | "right";

/**
 * The panel itself.
 *
 * `open` and `onOpenChange` are forwarded to the dialog root, so the panel
 * can be driven from outside — the mentor review drawer opens it from a table
 * row rather than from a trigger inside it.
 */
const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Dialog.Popup>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Dialog.Popup> & {
    side?: SheetSide;
  }
>(({ className, children, side = "right", ...props }, ref) => (
  <DialogPrimitive.Dialog.Portal>
    <SheetOverlay />
    <DialogPrimitive.Dialog.Viewport
      className={cn(
        "fixed inset-0 z-50 flex",
        side === "right" ? "justify-end" : "justify-start",
      )}
    >
      <DialogPrimitive.Dialog.Popup
        ref={ref}
        data-side={side}
        className={cn(
          "flex h-full w-full max-w-2xl flex-col overflow-hidden border-surface-container bg-surface-container-lowest shadow-[var(--shadow-3)] transition-[opacity,translate] duration-200 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0 data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=left]:data-ending-style:translate-x-[-2.5rem]",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Dialog.Popup>
    </DialogPrimitive.Dialog.Viewport>
  </DialogPrimitive.Dialog.Portal>
));
SheetContent.displayName = DialogPrimitive.Dialog.Popup.displayName;

/** Header region of the panel. */
const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1.5 border-b border-surface-container px-6 py-5",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

/** Accessible title of the panel. */
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Dialog.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Dialog.Title
    ref={ref}
    className={cn("text-headline-md text-on-surface font-semibold", className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Dialog.Title.displayName;

/** Accessible description of the panel. */
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Dialog.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Dialog.Description
    ref={ref}
    className={cn("text-body-sm text-on-surface-variant", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Dialog.Description.displayName;

/** Sticky action region at the bottom of the panel. */
const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-3 border-t border-surface-container bg-surface-container-lowest px-6 py-4 sm:flex-row sm:items-center sm:justify-end",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
};
