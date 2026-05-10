import { Router } from "express";
import { z } from "zod";
import { categoriesController } from "@/controllers/categories.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import { createCategorySchema, updateCategorySchema } from "@/validations/category.schema";
import { idParamSchema } from "@/validations/common.schema";
import { ROLES } from "@/config/constants";

const router = Router();

router.get("/", asyncHandler(categoriesController.list));

router.get(
  "/:id",
  validate(z.object({ params: idParamSchema })),
  asyncHandler(categoriesController.getById),
);

// Sadece admin
router.use(authenticate, requireRole(ROLES.ADMIN));

router.post("/", validate(createCategorySchema), asyncHandler(categoriesController.create));

router.patch(
  "/:id",
  validate(z.object({ params: idParamSchema, body: updateCategorySchema.shape.body })),
  asyncHandler(categoriesController.update),
);

router.delete(
  "/:id",
  validate(z.object({ params: idParamSchema })),
  asyncHandler(categoriesController.delete),
);

export default router;
