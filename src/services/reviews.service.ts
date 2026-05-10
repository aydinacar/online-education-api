import { eq, and, desc, avg, count, sql } from "drizzle-orm";
import { db } from "@/config/database";
import { reviews, courses, users, enrollments } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import type {
  CreateReviewInput,
  UpdateReviewInput,
} from "@/validations/review.schema";

async function refreshCourseStats(courseId: string) {
  const statsRows = await db
    .select({
      avg: avg(reviews.rating),
      cnt: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.courseId, courseId));

  const stats = statsRows[0];
  await db
    .update(courses)
    .set({
      rating: stats?.avg ?? "0",
      reviewCount: Number(stats?.cnt) || 0,
    })
    .where(eq(courses.id, courseId));
}

export const reviewsService = {
  async listByCourse(courseId: string) {
    return db
      .select({
        review: reviews,
        user: { id: users.id, name: users.name, avatar: users.avatar },
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.courseId, courseId))
      .orderBy(desc(reviews.createdAt));
  },

  async create(userId: string, input: CreateReviewInput) {
    // Sadece enroll olmuş kullanıcı review yazabilir
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, input.courseId)))
      .limit(1);

    if (!enrollment) {
      throw ApiError.forbidden("Bu kursa kayıt olmadan değerlendirme yapamazsınız");
    }

    const [existing] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.courseId, input.courseId)))
      .limit(1);

    if (existing) {
      throw ApiError.conflict("Bu kursu zaten değerlendirdiniz");
    }

    const [review] = await db
      .insert(reviews)
      .values({ ...input, userId })
      .returning();

    await refreshCourseStats(input.courseId);
    return review;
  },

  async update(id: string, userId: string, input: UpdateReviewInput) {
    const [existing] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing) throw ApiError.notFound("Değerlendirme bulunamadı");
    if (existing.userId !== userId) {
      throw ApiError.forbidden("Bu değerlendirmeyi düzenleyemezsiniz");
    }

    const [review] = await db
      .update(reviews)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();

    await refreshCourseStats(existing.courseId);
    return review;
  },

  async delete(id: string, userId: string, isAdmin: boolean) {
    const [existing] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing) throw ApiError.notFound("Değerlendirme bulunamadı");
    if (existing.userId !== userId && !isAdmin) {
      throw ApiError.forbidden("Bu değerlendirmeyi silemezsiniz");
    }
    await db.delete(reviews).where(eq(reviews.id, id));
    await refreshCourseStats(existing.courseId);
  },
};

// silence "sql" import warning (kullanılabilir ileride)
void sql;
