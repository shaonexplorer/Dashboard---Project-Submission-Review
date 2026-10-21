import type { Response } from "express";

export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

/**
 * Describes where a page sits inside a larger result set.
 *
 * `total` counts every record matching the active filters — before pagination
 * is applied — and `totalPages` is derived from it.
 */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedApiResponse<T = unknown> = ApiResponse<T[]> & {
  pagination: PaginationMeta;
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

/**
 * Send a successful paginated response in the project's standard shape.
 *
 * The rows live in `data` and the pagination metadata sits next to it, so a
 * client can render the table and its pager from a single payload.
 */
export function sendPaginatedResponse<T = unknown>(
  res: Response,
  statusCode: number,
  message: string,
  data: T[],
  pagination: PaginationMeta
): Response {
  const body: PaginatedApiResponse<T> = {
    success: true,
    message,
    data,
    pagination,
  };

  return res.status(statusCode).json(body);
}
