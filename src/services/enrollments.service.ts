import { eq, and, desc } from "drizzle-orm";
import { db } from "@/config/database";
import { enrollments, courses, categories, users } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { coursesService } from "./courses.service";

export const enrollmentsService = {
  async enroll(userId: string, courseId: string) {
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) throw ApiError.notFound("Kurs bulunamadı");

    const [existing] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existing) {
      throw ApiError.conflict("Bu kursa zaten kayıtlısınız");
    }

    // Ücretliyse normalde önce payment akışı tamamlanmalı.
    // Şimdilik direkt enroll edelim - payment service ileride bu service'i çağırır.
    const [enrollment] = await db
      .insert(enrollments)
      .values({ userId, courseId })
      .returning();

    await coursesService.incrementStudentCount(courseId);

    return enrollment;
  },

  async myCourses(userId: string) {
    return db
      .select({
        enrollment: enrollments,
        course: courses,
        category: categories,
        instructor: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));
  },

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const [row] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);
    return !!row;
  },
};
