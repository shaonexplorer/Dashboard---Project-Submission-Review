export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;
  public readonly isOperational: boolean;
  /**
   * Optional machine-readable discriminator, e.g. "DUPLICATE_SUBMISSION".
   *
   * A client reacts to a specific failure mode from this code rather than by
   * pattern-matching on the human-readable message. It is optional on purpose:
   * an error that does not set one keeps the exact response shape it has
   * always had.
   */
  public readonly code?: string;

  constructor(
    statusCode: number,
    message: string,
    errors?: unknown,
    isOperational = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.code = code;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
