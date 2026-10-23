import express from "express";

import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "./auth.middleware";
import { authRateLimiter } from "../../middleware/authRateLimiter.middleware";
import {
  loginController,
  meController,
  signupController,
} from "./auth.controller";
import { loginSchema, signupSchema } from "./auth.validations";

const router = express.Router();

router.post(
  "/signup",
  authRateLimiter,
  validate(signupSchema, "body"),
  signupController
);

router.post("/login", authRateLimiter, validate(loginSchema, "body"), loginController);

router.get("/me", authenticate, meController);

export default router;