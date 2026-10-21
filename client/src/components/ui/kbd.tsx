import * as React from "react";

import { cn } from "@/lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** The key or key combination shown inside the cap, e.g. `⌘K` or `Enter`. */
  children: React.ReactNode;
}

/**
 * A keyboard key cap.
 *
 * Advertises a shortcut next to the control it belongs to, so the shortcut is
 * discoverable without a separate help panel.
 */
function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded bg-surface-container px-1.5 py-0.5 text-code-sm text-on-surface-variant",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export { Kbd };
