import { cn } from "@/lib/utils";

/**
 * The colour an avatar chip is painted with.
 *
 * Two students in the same queue are told apart by the colour of their chip as
 * well as by their name, so a mentor can recognise a hand-in across pages.
 */
const AVATAR_TONES = [
  "bg-primary-fixed text-on-primary-fixed-variant",
  "bg-secondary-container text-on-secondary-container",
  "bg-surface-container-highest text-on-surface-variant",
  "bg-surface-variant text-on-surface-variant",
] as const;

/**
 * Picks the tone of an avatar from the student's id.
 *
 * The colour is derived from the id rather than from the row position, so it
 * stays with the student when the queue is sorted, filtered or paginated.
 */
function toneFor(studentId: string): string {
  let hash = 0;

  for (let index = 0; index < studentId.length; index += 1) {
    hash = (hash * 31 + studentId.charCodeAt(index)) % 100_003;
  }

  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/**
 * Two-letter initials for the avatar chip.
 *
 * A name with one word falls back to its first two letters, and an empty name
 * renders as a question mark rather than as an empty chip.
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export interface StudentAvatarProps {
  /** The student's full name. */
  name: string;
  /** The student's id — the chip colour is derived from it. */
  studentId: string;
  /** The size of the chip. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * The initials chip that stands in for a student's avatar.
 *
 * The chip is decorative: the student's name is always rendered next to it, so
 * the chip is hidden from assistive technology rather than read out as a
 * meaningless string of initials.
 */
export function StudentAvatar({
  name,
  studentId,
  size = "md",
  className,
}: StudentAvatarProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        size === "sm"
          ? "size-6 font-code-sm text-[11px]"
          : "size-9 font-label-md text-label-md",
        toneFor(studentId),
        className,
      )}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
