import { z } from "zod";

export const createSectionSchema = z.object({
  body: z.object({
    courseId: z.string().uuid("Geçerli bir kurs seçin"),
    title: z.string().min(2).max(200),
    order: z.number().int().min(0).optional(),
  }),
});

export const updateSectionSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const reorderSectionsSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    items: z
      .array(
        z.object({
          id: z.string().uuid(),
          order: z.number().int().min(0),
        }),
      )
      .min(1),
  }),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>["body"];
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>["body"];
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>["body"];
