import { eq, asc, count } from "drizzle-orm";
import { db } from "@/config/database";
import { categories, courses } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { slugify } from "@/utils/slugify";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/validations/category.schema";

export const categoriesService = {
  async list() {
    return db.select().from(categories).orderBy(asc(categories.name));
  },

  async getById(id: string) {
    const [c] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!c) throw ApiError.notFound("Kategori bulunamadı");
    return c;
  },

  async create(input: CreateCategoryInput) {
    const slug = input.slug || slugify(input.name);
    const [c] = await db
      .insert(categories)
      .values({ ...input, slug })
      .returning();
    if (!c) throw ApiError.internal("Kategori oluşturulamadı");
    return c;
  },

  async update(id: string, input: UpdateCategoryInput) {
    const update: Record<string, unknown> = { ...input, updatedAt: new Date() };
    if (input.name && !input.slug) update.slug = slugify(input.name);

    const [c] = await db
      .update(categories)
      .set(update)
      .where(eq(categories.id, id))
      .returning();
    if (!c) throw ApiError.notFound("Kategori bulunamadı");
    return c;
  },

  async delete(id: string) {
    const [row] = await db
      .select({ count: count() })
      .from(courses)
      .where(eq(courses.categoryId, id));
    const courseCount = row?.count ?? 0;

    if (courseCount > 0) {
      throw ApiError.conflict(
        `Bu kategoriye bağlı ${courseCount} kurs var; önce kursları taşıyın veya silin`,
      );
    }

    const [c] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    if (!c) throw ApiError.notFound("Kategori bulunamadı");
  },
};
