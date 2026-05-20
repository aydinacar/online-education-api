import { Router } from "express";
import { z } from "zod";
import { quizzesController } from "@/controllers/quizzes.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import {
  createQuizSchema,
  updateQuizSchema,
  submitAttemptSchema,
} from "@/validations/quiz.schema";
import { idParamSchema } from "@/validations/common.schema";
import { ROLES } from "@/config/constants";

const router = Router();

// Ders bazlı erişim (öğrenci + eğitmen)
router.get(
  "/by-lesson/:lessonId",
  authenticate,
  validate(
    z.object({ params: z.object({ lessonId: z.string().uuid("Geçerli bir ders seçin") }) }),
  ),
  asyncHandler(quizzesController.getByLesson),
);

router.post(
  "/",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(createQuizSchema),
  asyncHandler(quizzesController.create),
);

router.patch(
  "/:id",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(z.object({ params: idParamSchema, body: updateQuizSchema.shape.body })),
  asyncHandler(quizzesController.update),
);

router.delete(
  "/:id",
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(z.object({ params: idParamSchema })),
  asyncHandler(quizzesController.delete),
);

// Attempts
router.post(
  "/:id/attempts",
  authenticate,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(quizzesController.startAttempt),
);

router.get(
  "/:id/attempts",
  authenticate,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(quizzesController.listAttempts),
);

router.post(
  "/attempts/:id/submit",
  authenticate,
  validate(
    z.object({ params: idParamSchema, body: submitAttemptSchema.shape.body }),
  ),
  asyncHandler(quizzesController.submitAttempt),
);

router.get(
  "/attempts/:id",
  authenticate,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(quizzesController.getAttempt),
);

export default router;
