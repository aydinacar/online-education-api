import { Router } from "express";
import { authController } from "@/controllers/auth.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { authLimiter } from "@/middleware/rate-limit.middleware";
import { asyncHandler } from "@/utils/async-handler";
import { registerSchema, loginSchema, refreshTokenSchema } from "@/validations/auth.schema";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);

router.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));

router.post("/refresh", validate(refreshTokenSchema), asyncHandler(authController.refresh));

router.post("/logout", validate(refreshTokenSchema), asyncHandler(authController.logout));

router.get("/me", authenticate, asyncHandler(authController.me));

export default router;
