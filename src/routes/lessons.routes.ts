import { Router } from "express";
import { z } from "zod";
import { lessonsController } from "@/controllers/lessons.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import {
  createLessonSchema,
  updateLessonSchema,
  updateProgressSchema,
} from "@/validations/lesson.schema";
import { idParamSchema } from "@/validations/common.schema";
import { ROLES } from "@/config/constants";

const router = Router();

router.get(
  "/:id",
  authenticate,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(lessonsController.getById),
);

router.post(
  "/",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(createLessonSchema),
  asyncHandler(lessonsController.create),
);

router.patch(
  "/:id",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(z.object({ params: idParamSchema, body: updateLessonSchema.shape.body })),
  asyncHandler(lessonsController.update),
);

router.delete(
  "/:id",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(z.object({ params: idParamSchema })),
  asyncHandler(lessonsController.delete),
);

router.post(
  "/:id/complete",
  authenticate,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(lessonsController.markCompleted),
);

router.patch(
  "/:id/progress",
  authenticate,
  validate(z.object({ params: idParamSchema, body: updateProgressSchema.shape.body })),
  asyncHandler(lessonsController.updateProgress),
);

export default router;
