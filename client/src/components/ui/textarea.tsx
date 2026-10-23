import * as React from "react"
import { cn } from "@/lib/utils"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Hint text (e.g., character count) */
  hint?: string
  /** Hint ID for aria-describedby */
  hintId?: string
}

function Textarea({
  className,
  hint: _hint,
  hintId,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextareaProps) {
  // Include hint in aria-describedby if provided
  const describedBy = [ariaDescribedBy, hintId].filter(Boolean).join(" ") || undefined

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      aria-describedby={describedBy}
      {...props}
    />
  )
}

export { Textarea }
