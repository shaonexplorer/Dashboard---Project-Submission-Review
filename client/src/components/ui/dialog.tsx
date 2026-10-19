"use client"

import * as React from "react"
import * as DialogPrimitive from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Dialog.Root

const DialogTrigger = DialogPrimitive.Dialog.Trigger

const DialogPortal = DialogPrimitive.Dialog.Portal

const DialogClose = DialogPrimitive.Dialog.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Dialog.Backdrop>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Dialog.Backdrop>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Dialog.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Dialog.Backdrop.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Dialog.Popup>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Dialog.Popup>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Dialog.Portal>
    <DialogOverlay />
    <DialogPrimitive.Dialog.Viewport
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        className
      )}
    >
      <DialogPrimitive.Dialog.Popup
        ref={ref}
        className={cn(
          "w-full max-w-lg rounded-xl border border-input bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-50 ring-offset-background transition-opacity hover:opacity-100 hover:focus:bg-accent data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
          <span className="sr-only">Close</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </DialogPrimitive.Dialog.Close>
      </DialogPrimitive.Dialog.Popup>
    </DialogPrimitive.Dialog.Viewport>
  </DialogPrimitive.Dialog.Portal>
))
DialogContent.displayName = DialogPrimitive.Dialog.Popup.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Dialog.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Dialog.Title
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Dialog.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Dialog.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Dialog.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Dialog.Description.displayName

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
