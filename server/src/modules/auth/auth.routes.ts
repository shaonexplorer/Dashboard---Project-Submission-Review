import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../../lib/auth";

const router = express.Router();

// Mount BetterAuth handler for all auth routes
router.use("/", toNodeHandler(auth));

export default router;