"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandPanel } from "./brand-panel";
import { AuthCard } from "./auth-card";

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Left column content (brand panel) */
  brandPanel?: React.ReactNode;
  /** Whether to show the brand panel (on lg and up) */
  showBrandPanel?: boolean;
  className?: string;
}

export function AuthLayout({
  children,
  brandPanel,
  showBrandPanel = true,
  className,
}: AuthLayoutProps) {
  return (
    <div className={cn("h-screen bg-background flex flex-col", className)}>
      <AuthHeader />
      <main className="flex-1 w-full flex items-center justify-center px-2 sm:px-6 py-0 md:py-0">
        <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {showBrandPanel && brandPanel ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="hidden lg:col-span-5 sm:flex flex-col justify-between space-y-8 lg:py-4">
                {brandPanel}
              </div>
              <div className="lg:col-span-7   ">
                <AuthCard>{children}</AuthCard>
              </div>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <div className="w-full  ">
                <AuthCard>{children}</AuthCard>
              </div>
            </div>
          )}
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}

function AuthHeader() {
  return (
    <header className="w-full py-4 px-6 md:px-12 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest/70 backdrop-blur-sm">
      <Link
        className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-transform active:scale-[0.98]"
        href="/"
      >
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-on-primary shadow-sm">
          <span className="material-symbols-outlined text-[16px]">layers</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold tracking-tight text-on-surface">
            ProjectHub
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded border border-outline-variant text-on-surface-variant font-medium bg-surface-container-low">
            Auth
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-medium text-on-surface-variant">
            Academic Gateway
          </span>
        </div>
      </div>
    </header>
  );
}

function AuthFooter() {
  return (
    <footer className="w-full py-4 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-outline-variant/30 text-xs text-on-surface-variant bg-surface-container">
      <div className="flex items-center gap-3">
        <span>&copy; 2025 ProjectHub Education</span>
        <span className="hidden sm:inline font-mono">&#8226;</span>
        <span className="hidden sm:inline font-mono">v2.4.0-stable</span>
      </div>
      <div className="flex items-center gap-6 text-on-surface-variant">
        <a
          className="hover:text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
          href="#"
        >
          Terms
        </a>
        <a
          className="hover:text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
          href="#"
        >
          Privacy
        </a>
        <a
          className="hover:text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
          href="#"
        >
          Status
        </a>
      </div>
    </footer>
  );
}
