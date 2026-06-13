import { z } from "zod";
import { LESSON_TYPES } from "@/config/constants";

export const createLessonSchema = z.object({
  body: z.object({
    courseId: z.string().uuid("Geçerli bir kurs seçin"),
    sectionId: z.string().uuid().nullable().optional(),
    title: z.string().min(2).max(200),
    type: z.enum(LESSON_TYPES),
    order: z.number().int().min(0).optional(),
    duration: z.number().int().min(0).optional(),
    videoUrl: z.string().url().optional(),
    content: z.string().optional(),
    isFree: z.boolean().optional(),
    scheduledAt: z.coerce.date().optional(),
    meetingUrl: z.string().url().optional(),
    recordingUrl: z.string().url().optional(),
  }),
});

export const updateLessonSchema = z.object({
  body: createLessonSchema.shape.body.omit({ courseId: true }).partial(),
});

export const reorderLessonsSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    items: z
      .array(
        z.object({
          id: z.string().uuid(),
          sectionId: z.string().uuid().nullable(),
          order: z.number().int().min(0),
        }),
      )
      .min(1),
  }),
});

export const updateProgressSchema = z.object({
  body: z.object({
    watchedSeconds: z.number().int().min(0),
  }),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>["body"];
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>["body"];
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>["body"];
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>["body"];
