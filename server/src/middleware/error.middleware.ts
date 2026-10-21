import { ApiError } from "../utils/api-error";
import type { ErrorRequestHandler, Request, Response } from "express";

/**
 * Global error handler. Converts errors thrown anywhere in the application
 * into the project's standard error response without leaking internals.
 *
 * Unexpected errors (no status code, or statusCode >= 500) are reported to
 * clients as a safe 500 "Internal Server Error" — stack traces never leave
 * the server.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational ?? false;

  // Unexpected errors: hide internals and return a safe default message.
  const message =
    isOperational || statusCode < 500 ? err.message : "Internal Server Error";

  const body: Record<string, unknown> = {
    success: false,
    message,
  };

  if (err.errors !== undefined) {
    body.errors = err.errors;
  }

  // The machine-readable discriminator is copied into the body only when the
  // error set one. Every other error response stays exactly as it was.
  if (err.code !== undefined) {
    body.code = err.code;
  }

  if (!isOperational) {
    console.error(err);
  }

  return res.status(statusCode).json(body);
};
