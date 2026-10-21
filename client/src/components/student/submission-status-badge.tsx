/**
 * The submission status badge now lives in the shared `submissions` folder,
 * because the student dashboard and the mentor review table both render it.
 *
 * This module re-exports it so the existing student imports keep working.
 */
export {
  SubmissionStatusBadge,
  getSubmissionStatusMeta,
} from "@/components/submissions/submission-status-badge";
export type { SubmissionStatusMeta } from "@/components/submissions/submission-status-badge";
