"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TerminalSnippetProps {
  prompt: string;
  lines: Array<{ text: string; className?: string }>;
  className?: string;
}

export function TerminalSnippet({ prompt, lines, className }: TerminalSnippetProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-inverse-surface text-inverse-on-surface p-4 shadow-md overflow-hidden relative",
        className,
      )}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-variant/20">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
        </div>
        <span className="text-code-sm text-surface-container-high opacity-80">
          cli.projecthub.edu v2.4-ok
        </span>
      </div>
      <pre className="text-code-md leading-relaxed selection:bg-primary-container selection:text-white space-y-1">
        <code>
          <span className="text-secondary-fixed-dim">$</span>{" "}
          <span>{prompt}</span>
          {lines.map((line, index) => (
            <React.Fragment key={index}>
              <br />
              <span className={cn("text-surface-container-highest", line.className)}>
                {line.text}
              </span>
            </React.Fragment>
          ))}
        </code>
      </pre>
    </div>
  );
}