import express from "express";

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


export default router;
