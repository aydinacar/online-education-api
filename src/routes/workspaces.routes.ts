import { Router } from "express";
import { z } from "zod";
import { workspacesController } from "@/controllers/workspaces.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/async-handler";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addWorkspaceMemberSchema,
  transferOwnershipSchema,
} from "@/validations/workspace.schema";
import { idParamSchema } from "@/validations/common.schema";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  validate(createWorkspaceSchema),
  asyncHandler(workspacesController.create),
);

router.get(
  "/:id",
  validate(z.object({ params: idParamSchema })),
  asyncHandler(workspacesController.getById),
);

router.patch(
  "/:id",
  validate(
    z.object({ params: idParamSchema, body: updateWorkspaceSchema.shape.body }),
  ),
  asyncHandler(workspacesController.update),
);

router.get(
  "/:id/members",
  validate(z.object({ params: idParamSchema })),
  asyncHandler(workspacesController.getMembers),
);

router.post(
  "/:id/members",
  validate(
    z.object({
      params: idParamSchema,
      body: addWorkspaceMemberSchema.shape.body,
    }),
  ),
  asyncHandler(workspacesController.addMember),
);

router.delete(
  "/:id/members/:userId",
  validate(
    z.object({
      params: z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    }),
  ),
  asyncHandler(workspacesController.removeMember),
);

router.post(
  "/:id/transfer",
  validate(
    z.object({
      params: idParamSchema,
      body: transferOwnershipSchema.shape.body,
    }),
  ),
  asyncHandler(workspacesController.transferOwnership),
);

export default router;
