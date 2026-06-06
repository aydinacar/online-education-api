import { z } from "zod";

export const certificateNumberParamSchema = z.object({
  params: z.object({
    number: z.string().min(1, "Sertifika numarası gerekli"),
  }),
});

export const courseIdParamSchema = z.object({
  params: z.object({
    courseId: z.string().uuid("Geçerli bir kurs seçin"),
  }),
});
