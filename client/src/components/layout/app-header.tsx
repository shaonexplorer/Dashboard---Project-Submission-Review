"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  /** Routes that are not implemented yet are rendered as disabled, never as dead links. */
  href?: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  STUDENT: [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "My Projects", href: "/student/my-projects" },
    // { label: "Rubrics" },
  ],
  MENTOR: [
    { label: "Dashboard", href: "/mentor/dashboard" },
    // { label: "Review Queue" },
    { label: "Rubrics" },
  ],
};

/**
 * Application top navigation.
 *
 * The brand, primary navigation and account menu follow the ProjectHub design
 * language. Navigation entries for screens that are not implemented yet are
 * rendered as inert text so the information architecture is visible without
 * offering the user a broken link.
 */
export function AppHeader() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const navItems = NAV_BY_ROLE[user?.role ?? "STUDENT"] ?? NAV_BY_ROLE.STUDENT;

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-[1440px] mx-auto px-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link
            href={
              user?.role === "MENTOR"
                ? "/mentor/dashboard"
                : "/student/dashboard"
            }
            className="flex items-center gap-2"
          >
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary text-[20px]"
                aria-hidden="true"
              >
                code_blocks
              </span>
            </div>
            <span className="text-headline-sm tracking-tight text-on-surface font-semibold">
              ProjectHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {navItems.map((item) => {
              if (!item.href) {
                return (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    className="px-4 py-1 rounded-lg text-label-md text-on-surface-variant opacity-50 cursor-not-allowed"
                  >
                    {item.label}
                  </span>
                );
              }

              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "px-4 py-1 rounded-lg text-label-md transition-colors",
                    isActive
                      ? "bg-surface-container-high text-on-surface font-medium"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pl-2">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary text-[18px]"
                aria-hidden="true"
              >
                person
              </span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-label-md text-on-surface leading-tight font-medium">
                {user?.fullName ?? "Student"}
              </span>
              <span className="text-label-sm text-on-surface-variant text-code-sm">
                {user ? accountSubLabel(user.role, user.id) : "Student Portal"}
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-surface-container-high hidden sm:block" />

          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors disabled:opacity-50"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              logout
            </span>
            <span className="hidden md:inline">
              {isLoggingOut ? "Signing out..." : "Logout"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

/** Secondary line under the account name, e.g. `Student ID · #8492`. */
function accountSubLabel(role: string, userId: string): string {
  if (role === "MENTOR") {
    return "Mentor Workspace";
  }
  return `Student ID · #${userId.slice(-4).toUpperCase()}`;
}
