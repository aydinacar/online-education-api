import { z } from "zod";

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir")
      .min(2)
      .max(120)
      .optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: createWorkspaceSchema.shape.body.partial(),
});

export const addWorkspaceMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const transferOwnershipSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>["body"];
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>["body"];
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>["body"];
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>["body"];
