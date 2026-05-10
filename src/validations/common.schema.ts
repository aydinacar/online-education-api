import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("Geçerli bir ID girin"),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type SlugParam = z.infer<typeof slugParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
