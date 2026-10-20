/** Small presentation helpers shared by the student dashboard components. */

/**
 * Formats an ISO timestamp as a UTC date and time, e.g. `20 Oct 2026, 14:32 UTC`.
 *
 * The dashboard always renders timestamps in UTC so students and mentors read
 * the same value regardless of their local timezone.
 */
export function formatUtcDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const day = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);

  return `${day}, ${time} UTC`;
}

/**
 * Renders a URL as a compact label for display.
 *
 * GitHub links keep their path (`github.com/user/repo`) because the repository
 * identity is meaningful; other links are reduced to their hostname.
 */
export function formatUrlLabel(value: string): string {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "");

    if (url.hostname === "github.com" || url.hostname === "www.github.com") {
      return `${url.hostname}${path}`;
    }

    return url.hostname;
  } catch {
    return value;
  }
}
