import { z } from "zod";

export const createEnrollmentSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
  }),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>["body"];
