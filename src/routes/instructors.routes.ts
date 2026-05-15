import { Router } from "express";
import { z } from "zod";
import { instructorsController } from "@/controllers/instructors.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import { instructorFilterSchema } from "@/validations/instructor.schema";
import { idParamSchema } from "@/validations/common.schema";

const router = Router();

router.get("/", validate(instructorFilterSchema), asyncHandler(instructorsController.list));

router.get(
  "/:id",
  validate(z.object({ params: idParamSchema })),
  asyncHandler(instructorsController.getById),
);

export default router;
