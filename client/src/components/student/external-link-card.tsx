import { formatUrlLabel } from "@/lib/format";

interface ExternalLinkCardProps {
  /**
   * The destination. When `null` the card renders a muted "not provided"
   * state instead of a link — a missing URL must never become a broken link.
   */
  href: string | null;
  title: string;
  /** Material Symbols glyph shown in the icon tile. */
  icon: string;
}

/**
 * Read-only card linking to the repository or the deployed project.
 *
 * External destinations open in a new tab and carry an explicit icon and a
 * visible URL label, so the link stays identifiable without relying on colour
 * and remains reachable from the keyboard.
 */
export function ExternalLinkCard({ href, title, icon }: ExternalLinkCardProps) {
  if (!href) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/60 border border-dashed border-surface-container-high">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              {icon}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-label-md font-semibold text-on-surface-variant">
              {title}
            </span>
            <span className="text-code-sm text-secondary">Not provided</span>
          </div>
        </div>
        <span
          className="material-symbols-outlined text-outline text-[18px] shrink-0 ml-2"
          aria-hidden="true"
        >
          link_off
        </span>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="size-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface shrink-0">
          <span
            className="material-symbols-outlined text-[18px]"
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors">
            {title}
          </span>
          <span className="text-code-sm text-secondary truncate">
            {formatUrlLabel(href)}
          </span>
        </div>
      </div>
      <span
        className="material-symbols-outlined text-secondary group-hover:text-primary text-[18px] shrink-0 ml-2"
        aria-hidden="true"
      >
        open_in_new
      </span>
    </a>
  );
}
