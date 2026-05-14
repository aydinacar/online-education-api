import { Router } from "express";
import { z } from "zod";
import { sectionsController } from "@/controllers/sections.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import {
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
} from "@/validations/section.schema";
import { idParamSchema } from "@/validations/common.schema";
import { ROLES } from "@/config/constants";

const router = Router();

router.post(
  "/reorder",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(reorderSectionsSchema),
  asyncHandler(sectionsController.reorder),
);

router.post(
  "/",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(createSectionSchema),
  asyncHandler(sectionsController.create),
);

router.patch(
  "/:id",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(z.object({ params: idParamSchema, body: updateSectionSchema.shape.body })),
  asyncHandler(sectionsController.update),
);

router.delete(
  "/:id",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(z.object({ params: idParamSchema })),
  asyncHandler(sectionsController.delete),
);

export default router;
