import { z } from "zod";

export const instructorFilterSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    sort: z.enum(["popular", "rating", "newest", "courses"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export type InstructorFilterInput = z.infer<typeof instructorFilterSchema>["query"];
