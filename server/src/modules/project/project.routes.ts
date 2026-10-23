import express from "express";

import { authenticate } from "../auth/auth.middleware";
import { getProjectsController } from "./project.controller";

const router = express.Router();

/**
 * GET /api/projects
 *
 * Lists the catalog of assignable projects.
 *
 * Middleware chain:
 * 1. authenticate - Verifies JWT token from cookie
 *
 * The endpoint is role-agnostic on purpose: both `STUDENT` and `MENTOR`
 * receive the same catalog, so it is protected by `authenticate` alone and
 * not by `authorize`.
 *
 * Responses:
 * - 200 OK: The active catalog, ordered by name
 * - 401 Unauthorized: Missing or invalid token
 * - 500 Internal Server Error: Unexpected error
 */
router.get("/", authenticate, getProjectsController);

export default router;
