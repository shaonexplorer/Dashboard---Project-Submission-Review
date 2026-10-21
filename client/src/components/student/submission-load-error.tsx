import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api/client";

/**
 * Shown when the existing submission could not be loaded.
 *
 * This state is deliberately separate from the empty state: a failed request
 * says nothing about whether a submission exists, so the UI must not claim
 * that the student has not submitted anything.
 */
export function SubmissionLoadError({
  error,
  onRetry,
  isRetrying,
}: {
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const isForbidden = error instanceof ApiRequestError && error.status === 403;

  return (
    <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 p-6 sm:p-7 flex flex-col gap-5">
      <Alert variant="destructive">
        <AlertTitle className="text-headline-sm">
          {isForbidden
            ? "This workspace is not available to student accounts"
            : "Could not load your submission"}
        </AlertTitle>
        <AlertDescription className="text-body-sm">
          {isForbidden
            ? "Only student accounts can use the submission workflow."
            : "We could not reach the submission service. Your project has not been affected — please try again."}
        </AlertDescription>
      </Alert>

      {!isForbidden && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? "Retrying…" : "Try again"}
          </Button>
        </div>
      )}
    </div>
  );
}
