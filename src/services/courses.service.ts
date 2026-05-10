import { eq, and, desc, asc, ilike, gte, lte, count, sql, type SQL } from "drizzle-orm";
import { db } from "@/config/database";
import { courses, categories, users } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { slugify } from "@/utils/slugify";
import { getPagination, buildPaginationMeta } from "@/utils/pagination";
import type { Role } from "@/config/constants";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  CourseFilterInput,
} from "@/validations/course.schema";

export const coursesService = {
  async list(filters: CourseFilterInput) {
    const { page, limit, offset } = getPagination({
      page: filters.page,
      limit: filters.limit,
    });

    const where: SQL[] = [eq(courses.isPublished, true)];
    if (filters.search) {
      where.push(ilike(courses.title, `%${filters.search}%`));
    }
    if (filters.category) {
      where.push(eq(categories.slug, filters.category));
    }
    if (filters.level) {
      where.push(eq(courses.level, filters.level));
    }
    if (filters.minPrice !== undefined) {
      where.push(gte(courses.price, filters.minPrice.toString()));
    }
    if (filters.maxPrice !== undefined) {
      where.push(lte(courses.price, filters.maxPrice.toString()));
    }

    const orderBy = (() => {
      switch (filters.sort) {
        case "popular":
          return desc(courses.studentCount);
        case "rating":
          return desc(courses.rating);
        case "price-asc":
          return asc(courses.price);
        case "price-desc":
          return desc(courses.price);
        default:
          return desc(courses.createdAt);
      }
    })();

    const data = await db
      .select({
        course: courses,
        category: categories,
        instructor: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          headline: users.headline,
        },
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(and(...where))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const totalRows = await db
      .select({ total: count() })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(and(...where));
    const total = totalRows[0]?.total ?? 0;

    return {
      data: data.map((row) => ({ ...row.course, category: row.category, instructor: row.instructor })),
      meta: buildPaginationMeta(page, limit, Number(total)),
    };
  },

  async getBySlug(slug: string) {
    const [row] = await db
      .select({
        course: courses,
        category: categories,
        instructor: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          headline: users.headline,
        },
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courses.slug, slug))
      .limit(1);

    if (!row) throw ApiError.notFound("Kurs bulunamadı");

    return { ...row.course, category: row.category, instructor: row.instructor };
  },

  async create(instructorId: string, input: CreateCourseInput) {
    const slug = slugify(input.title);
    const [course] = await db
      .insert(courses)
      .values({
        ...input,
        slug,
        price: input.price.toString(),
        instructorId,
      })
      .returning();
    return course;
  },

  async update(
    id: string,
    input: UpdateCourseInput,
    actor: { id: string; role: Role },
  ) {
    const [existing] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!existing) throw ApiError.notFound("Kurs bulunamadı");

    // Sahibi veya admin değilse yasak
    if (existing.instructorId !== actor.id && actor.role !== "admin") {
      throw ApiError.forbidden("Bu kursu düzenleme yetkiniz yok");
    }

    const update: Record<string, unknown> = { ...input, updatedAt: new Date() };
    if (input.price !== undefined) update.price = input.price.toString();
    if (input.title) update.slug = slugify(input.title);
    if (input.isPublished && !existing.isPublished) {
      update.publishedAt = new Date();
    }

    const [course] = await db
      .update(courses)
      .set(update)
      .where(eq(courses.id, id))
      .returning();
    return course;
  },

  async delete(id: string, actor: { id: string; role: Role }) {
    const [existing] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!existing) throw ApiError.notFound("Kurs bulunamadı");
    if (existing.instructorId !== actor.id && actor.role !== "admin") {
      throw ApiError.forbidden("Bu kursu silme yetkiniz yok");
    }
    await db.delete(courses).where(eq(courses.id, id));
  },

  async incrementStudentCount(courseId: string) {
    await db
      .update(courses)
      .set({ studentCount: sql`${courses.studentCount} + 1` })
      .where(eq(courses.id, courseId));
  },
};
