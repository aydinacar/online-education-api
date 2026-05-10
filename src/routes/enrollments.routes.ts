import { Router } from "express";
import { enrollmentsController } from "@/controllers/enrollments.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import { createEnrollmentSchema } from "@/validations/enrollment.schema";

const router = Router();

router.use(authenticate);

router.get("/my", asyncHandler(enrollmentsController.myCourses));

router.post("/", validate(createEnrollmentSchema), asyncHandler(enrollmentsController.enroll));

export default router;
