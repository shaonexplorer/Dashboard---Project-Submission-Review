import express from "express";

import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "./auth.middleware";
import {
  loginController,
  meController,
  signupController,
} from "./auth.controller";
import { loginSchema, signupSchema } from "./auth.validations";

const router = express.Router();

router.post(
  "/signup",
  validate(signupSchema, "body"),
  signupController
);

router.post("/login", validate(loginSchema, "body"), loginController);

router.get("/me", authenticate, meController);

export default router;
