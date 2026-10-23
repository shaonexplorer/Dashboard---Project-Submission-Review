import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/api-response";
import { getProjectsService } from "./project.service";

/**
 * Lists the assignable projects in the catalog.
 *
 * Requires:
 * - Authentication (handled by authenticate middleware)
 *
 * The endpoint is available to both `STUDENT` and `MENTOR` roles: the catalog
 * itself is not role-specific, and no write path for it exists in this phase.
 *
 * Returns 200 OK with the catalog in the project's standard success envelope.
 */
export const getProjectsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const projects = await getProjectsService();

    sendResponse(res, 200, "Projects retrieved", { projects });
  }
);
