import { Router } from "express";
import { usersController } from "@/controllers/users.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import { updateProfileSchema, changePasswordSchema } from "@/validations/user.schema";

const router = Router();

router.use(authenticate);

router.get("/me", asyncHandler(usersController.getMe));

router.patch("/me", validate(updateProfileSchema), asyncHandler(usersController.updateMe));

router.post(
  "/me/change-password",
  validate(changePasswordSchema),
  asyncHandler(usersController.changePassword),
);

export default router;
