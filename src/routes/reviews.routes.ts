import { Router } from "express";
import { z } from "zod";
import { reviewsController } from "@/controllers/reviews.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import { createReviewSchema, updateReviewSchema } from "@/validations/review.schema";
import { idParamSchema } from "@/validations/common.schema";

const router = Router();

router.get(
  "/course/:courseId",
  validate(z.object({ params: z.object({ courseId: z.string().uuid() }) })),
  asyncHandler(reviewsController.listByCourse),
);

router.use(authenticate);

router.post("/", validate(createReviewSchema), asyncHandler(reviewsController.create));

router.patch(
  "/:id",
  validate(z.object({ params: idParamSchema, body: updateReviewSchema.shape.body })),
  asyncHandler(reviewsController.update),
);

router.delete(
  "/:id",
  validate(z.object({ params: idParamSchema })),
  asyncHandler(reviewsController.delete),
);

export default router;
