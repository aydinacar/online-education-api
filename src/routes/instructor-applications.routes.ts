import { Router } from "express";
import { z } from "zod";
import { instructorApplicationsController } from "@/controllers/instructor-applications.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import {
  createInstructorApplicationSchema,
  listInstructorApplicationsSchema,
  reviewInstructorApplicationSchema,
} from "@/validations/instructor-application.schema";
import { idParamSchema } from "@/validations/common.schema";
import { ROLES } from "@/config/constants";

const router = Router();

router.use(authenticate);

// Kendi son başvurunu görüntüle (form ekranında durum göstermek için)
router.get("/me", asyncHandler(instructorApplicationsController.getMine));

// Başvuru oluştur (login olmuş herkes — service rol kontrolü yapıyor)
router.post(
  "/",
  validate(createInstructorApplicationSchema),
  asyncHandler(instructorApplicationsController.create),
);

// Admin endpoints
router.use(requireRole(ROLES.ADMIN));

router.get(
  "/",
  validate(listInstructorApplicationsSchema),
  asyncHandler(instructorApplicationsController.list),
);

router.get(
  "/:id",
  validate(z.object({ params: idParamSchema })),
  asyncHandler(instructorApplicationsController.getById),
);

router.post(
  "/:id/approve",
  validate(
    z.object({
      params: idParamSchema,
      body: reviewInstructorApplicationSchema.shape.body,
    }),
  ),
  asyncHandler(instructorApplicationsController.approve),
);

router.post(
  "/:id/reject",
  validate(
    z.object({
      params: idParamSchema,
      body: reviewInstructorApplicationSchema.shape.body,
    }),
  ),
  asyncHandler(instructorApplicationsController.reject),
);

export default router;
