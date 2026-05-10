import { z } from "zod";
import { COURSE_LEVELS } from "@/config/constants";

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(200),
    shortDescription: z.string().max(300).optional(),
    description: z.string().min(20).max(5000),
    categoryId: z.string().uuid("Geçerli bir kategori seçin"),
    level: z.enum(COURSE_LEVELS),
    price: z.coerce.number().min(0),
    thumbnail: z.string().url().optional(),
    whatYouWillLearn: z.array(z.string().min(1).max(200)).optional(),
    requirements: z.array(z.string().min(1).max(200)).optional(),
  }),
});

export const updateCourseSchema = z.object({
  body: createCourseSchema.shape.body.partial().extend({
    isPublished: z.boolean().optional(),
  }),
});

export const courseFilterSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    level: z.enum(COURSE_LEVELS).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(["newest", "popular", "rating", "price-asc", "price-desc"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>["body"];
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>["body"];
export type CourseFilterInput = z.infer<typeof courseFilterSchema>["query"];
