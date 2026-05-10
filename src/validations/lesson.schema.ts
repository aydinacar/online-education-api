import { z } from "zod";
import { LESSON_TYPES } from "@/config/constants";

export const createLessonSchema = z.object({
  body: z.object({
    sectionId: z.string().uuid(),
    title: z.string().min(2).max(200),
    type: z.enum(LESSON_TYPES),
    order: z.number().int().min(0).optional(),
    duration: z.number().int().min(0).optional(),
    videoUrl: z.string().url().optional(),
    content: z.string().optional(),
    isFree: z.boolean().optional(),
  }),
});

export const updateLessonSchema = z.object({
  body: createLessonSchema.shape.body.partial(),
});

export const updateProgressSchema = z.object({
  body: z.object({
    watchedSeconds: z.number().int().min(0),
  }),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>["body"];
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>["body"];
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>["body"];
