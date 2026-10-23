"use client";

import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

/**
 * Keyboard navigation shortcuts strip.
 *
 * Shows the available keyboard shortcuts for table navigation.
 */
export function KeyboardShortcutsStrip() {
  return (
    <div
      className={cn(
        "px-6 py-2 bg-surface-container-low/70 border-t border-outline-variant/30",
        "flex items-center justify-between text-secondary font-code-sm text-[11px]",
      )}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <span>Shortcuts:</span>
        <span className="flex items-center gap-1">
          <Kbd>J</Kbd>
          <Kbd>K</Kbd>
          Navigate rows
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Kbd>/</Kbd>
          Focus search
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Kbd>Enter</Kbd>
          Open project
        </span>
      </div>
      <span className="hidden md:inline text-secondary/80">
        Sync status: Live • All checks passing
      </span>
    </div>
  );
}