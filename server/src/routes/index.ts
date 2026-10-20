import express from "express";

import authRoutes from "../modules/auth/auth.routes";
import submissionRoutes from "../modules/submission/submission.routes";

const router = express.Router();

// Phase 03 keeps the routes layer ready for feature routes (auth,
// submissions, mentor workflows, ...). Feature routes are mounted here in
// later phases, between the CORS/JSON middleware and the 404 handler.

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});

// Authentication routes
router.use("/auth", authRoutes);

// Submission routes
router.use("/submissions", submissionRoutes);


export default router;
