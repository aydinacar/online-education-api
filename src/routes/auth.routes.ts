import { Router } from "express";
import { authController } from "@/controllers/auth.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { authLimiter } from "@/middleware/rate-limit.middleware";
import { asyncHandler } from "@/utils/async-handler";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from "@/validations/auth.schema";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);

router.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));

router.post("/refresh", asyncHandler(authController.refresh));

router.post("/logout", asyncHandler(authController.logout));

router.get("/me", authenticate, asyncHandler(authController.me));

router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  asyncHandler(authController.verifyEmail),
);

router.post(
  "/resend-verification",
  authenticate,
  authLimiter,
  asyncHandler(authController.resendVerification),
);

router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);

export default router;
