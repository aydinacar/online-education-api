import { Router } from "express";
import { coursesController } from "@/controllers/courses.controller";
import { authenticate, optionalAuthenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import {
  createCourseSchema,
  updateCourseSchema,
  courseFilterSchema,
} from "@/validations/course.schema";
import { idParamSchema, slugParamSchema } from "@/validations/common.schema";
import { z } from "zod";
import { ROLES } from "@/config/constants";

const router = Router();

// Public (admin token varsa draft kurslar da listelenir)
router.get(
  "/",
  optionalAuthenticate,
  validate(courseFilterSchema),
  asyncHandler(coursesController.list),
);

// Authenticated user'ın kayıtlı olduğu kurslar
router.get("/my", authenticate, asyncHandler(coursesController.myCourses));

// Instructor'ın kendi oluşturduğu kurslar (draft dahil)
router.get(
  "/teaching",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  asyncHandler(coursesController.teaching),
);

// ID ile fetch (instructor edit akışı için)
router.get(
  "/id/:id",
  authenticate,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(coursesController.getById),
);

// Curriculum (sections + lessons + unassigned) — sadece kurs sahibi/admin
router.get(
  "/id/:id/curriculum",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(z.object({ params: idParamSchema })),
  asyncHandler(coursesController.getCurriculum),
);

router.get(
  "/:slug",
  optionalAuthenticate,
  validate(z.object({ params: slugParamSchema })),
  asyncHandler(coursesController.getBySlug),
);

// Eğitmen / admin
router.post(
  "/",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(createCourseSchema),
  asyncHandler(coursesController.create),
);

router.patch(
  "/:id",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(z.object({ params: idParamSchema, body: updateCourseSchema.shape.body })),
  asyncHandler(coursesController.update),
);

router.delete(
  "/:id",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(z.object({ params: idParamSchema })),
  asyncHandler(coursesController.delete),
);

// Enrollment
router.post(
  "/:id/enroll",
  authenticate,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(coursesController.enroll),
);

export default router;
