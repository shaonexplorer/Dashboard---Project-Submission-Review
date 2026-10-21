/**
 * Application footer.
 *
 * Static platform information — deliberately rendered as plain text rather than
 * links to screens that do not exist yet.
 */
export function AppFooter() {
  return (
    <footer className="w-full bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] py-6 mt-auto">
      <div className="max-w-[1440px] mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-label-md text-on-surface-variant">
            ProjectHub Learning Assessment Platform
          </span>
          <span className="text-on-surface-variant text-label-sm" aria-hidden="true">
            ·
          </span>
          <span className="text-code-sm text-secondary">Project Submission</span>
        </div>
        <div className="flex items-center gap-6 text-on-surface-variant text-label-sm">
          <span>Academic Honesty</span>
          <span>Rubric Standards</span>
          <span>Support</span>
          <span className="text-on-surface-variant">
            © {new Date().getFullYear()} ProjectHub. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
