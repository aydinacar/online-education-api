import { z } from "zod";
import { INSTRUCTOR_APPLICATION_STATUSES } from "@/db/schema/instructor-applications";

export const createInstructorApplicationSchema = z.object({
  body: z.object({
    headline: z.string().min(10).max(200),
    bio: z.string().min(50).max(2000),
    expertiseAreas: z
      .array(z.string().min(2).max(50))
      .min(1, "En az bir uzmanlık alanı girin")
      .max(10),
    diplomaUrl: z.string().url("Geçerli bir URL girin"),
    certificateUrls: z.array(z.string().url()).max(10).optional(),
    sampleSyllabus: z.string().max(5000).optional(),
    portfolioUrl: z.string().url().optional(),
  }),
});

export const reviewInstructorApplicationSchema = z.object({
  body: z.object({
    reviewNote: z.string().max(2000).optional(),
  }),
});

export const listInstructorApplicationsSchema = z.object({
  query: z.object({
    status: z.enum(INSTRUCTOR_APPLICATION_STATUSES).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export type CreateInstructorApplicationInput = z.infer<
  typeof createInstructorApplicationSchema
>["body"];
export type ReviewInstructorApplicationInput = z.infer<
  typeof reviewInstructorApplicationSchema
>["body"];
export type ListInstructorApplicationsInput = z.infer<
  typeof listInstructorApplicationsSchema
>["query"];
