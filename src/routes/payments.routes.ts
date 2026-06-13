import { Router } from "express";
import { z } from "zod";
import { paymentsController } from "@/controllers/payments.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import { createPaymentSchema, updatePaymentStatusSchema } from "@/validations/payment.schema";
import { idParamSchema } from "@/validations/common.schema";
import { ROLES } from "@/config/constants";

const router = Router();

router.use(authenticate);

router.get("/my", asyncHandler(paymentsController.myPayments));

router.post("/", validate(createPaymentSchema), asyncHandler(paymentsController.create));

router.patch(
  "/:id/status",
  requireRole(ROLES.ADMIN),
  validate(z.object({ params: idParamSchema, body: updatePaymentStatusSchema.shape.body })),
  asyncHandler(paymentsController.updateStatus),
);

export default router;
