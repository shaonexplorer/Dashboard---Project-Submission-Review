import type { Response } from "express";

export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

/** Send a successful response in the project's standard shape. */
export function sendResponse<T = unknown>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response {
  const body: ApiResponse<T> = { success: true, message };

  if (data !== undefined) {
    body.data = data;
  }

  return res.status(statusCode).json(body);
}

/** Send an error response in the project's standard shape. */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  message: string
): Response {
  return res.status(statusCode).json({ success: false, message });
}
