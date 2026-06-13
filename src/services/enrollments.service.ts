import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@/config/database";
import {
  enrollments,
  courses,
  categories,
  users,
  lessons,
  lessonProgress,
} from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { coursesService } from "./courses.service";
import { certificatesService } from "./certificates.service";

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

    const [enrollment] = await db
      .insert(enrollments)
      .values({ userId, courseId })
      .returning();

    await coursesService.incrementStudentCount(courseId);

    return enrollment;
  },

  async myCourses(userId: string) {
    const rows = await db
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
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));

    return rows.map((row) => ({
      ...row.course,
      price: Number(row.course.price),
      rating: Number(row.course.rating),
      category: row.category,
      instructor: row.instructor,
    }));
  },

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const [row] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);
    return !!row;
  },

  async recalculateProgress(userId: string, courseId: string) {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (!enrollment) return null;

    const totalRows = await db
      .select({ value: count() })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));
    const totalLessons = totalRows[0]?.value ?? 0;

    const completedRows = await db
      .select({ value: count() })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessons.courseId, courseId),
          eq(lessonProgress.isCompleted, true),
        ),
      );
    const completedLessons = completedRows[0]?.value ?? 0;

    const progress =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const isComplete = totalLessons > 0 && completedLessons >= totalLessons;

    const [updated] = await db
      .update(enrollments)
      .set({
        progress,
        completedAt: isComplete
          ? (enrollment.completedAt ?? new Date())
          : null,
      })
      .where(eq(enrollments.id, enrollment.id))
      .returning();

    if (isComplete) {
      await certificatesService.issue(userId, courseId);
    }

    return updated;
  },
};
