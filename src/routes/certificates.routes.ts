import { Router } from "express";
import { certificatesController } from "@/controllers/certificates.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import {
  certificateNumberParamSchema,
  courseIdParamSchema,
} from "@/validations/certificate.schema";

const router = Router();

router.get(
  "/:number/verify",
  validate(certificateNumberParamSchema),
  asyncHandler(certificatesController.verify),
);

router.use(authenticate);

router.get("/my", asyncHandler(certificatesController.myCertificates));

router.get(
  "/course/:courseId",
  validate(courseIdParamSchema),
  asyncHandler(certificatesController.myCourseCertificate),
);

export default router;
