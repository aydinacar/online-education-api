import { eq, and, asc } from "drizzle-orm";
import { db } from "@/config/database";
import { lessons, sections, courses, lessonProgress } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import type { Role } from "@/config/constants";
import type {
  CreateLessonInput,
  UpdateLessonInput,
} from "@/validations/lesson.schema";

async function assertCourseOwnership(
  lessonId: string,
  actor: { id: string; role: Role },
) {
  const [row] = await db
    .select({ instructorId: courses.instructorId })
    .from(lessons)
    .innerJoin(sections, eq(lessons.sectionId, sections.id))
    .innerJoin(courses, eq(sections.courseId, courses.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!row) throw ApiError.notFound("Ders bulunamadı");
  if (row.instructorId !== actor.id && actor.role !== "admin") {
    throw ApiError.forbidden("Bu ders üzerinde işlem yapma yetkiniz yok");
  }
}

export const lessonsService = {
  async getById(id: string) {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    if (!lesson) throw ApiError.notFound("Ders bulunamadı");
    return lesson;
  },

  async getByCourse(courseId: string) {
    return db
      .select({
        section: sections,
        lesson: lessons,
      })
      .from(sections)
      .leftJoin(lessons, eq(lessons.sectionId, sections.id))
      .where(eq(sections.courseId, courseId))
      .orderBy(asc(sections.order), asc(lessons.order));
  },

  async create(input: CreateLessonInput, actor: { id: string; role: Role }) {
    // Section'ın ait olduğu course'un sahibi mi?
    const [row] = await db
      .select({ instructorId: courses.instructorId })
      .from(sections)
      .innerJoin(courses, eq(sections.courseId, courses.id))
      .where(eq(sections.id, input.sectionId))
      .limit(1);

    if (!row) throw ApiError.notFound("Bölüm bulunamadı");
    if (row.instructorId !== actor.id && actor.role !== "admin") {
      throw ApiError.forbidden("Bu kursa ders ekleme yetkiniz yok");
    }

    const [lesson] = await db.insert(lessons).values(input).returning();
    return lesson;
  },

  async update(
    id: string,
    input: UpdateLessonInput,
    actor: { id: string; role: Role },
  ) {
    await assertCourseOwnership(id, actor);
    const [lesson] = await db
      .update(lessons)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return lesson;
  },

  async delete(id: string, actor: { id: string; role: Role }) {
    await assertCourseOwnership(id, actor);
    await db.delete(lessons).where(eq(lessons.id, id));
  },

  async markCompleted(userId: string, lessonId: string) {
    const [existing] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(lessonProgress)
        .set({ isCompleted: true, completedAt: new Date(), lastWatchedAt: new Date() })
        .where(eq(lessonProgress.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(lessonProgress)
      .values({
        userId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
      })
      .returning();
    return created;
  },

  async updateProgress(userId: string, lessonId: string, watchedSeconds: number) {
    const [existing] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(lessonProgress)
        .set({ watchedSeconds, lastWatchedAt: new Date() })
        .where(eq(lessonProgress.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(lessonProgress)
      .values({ userId, lessonId, watchedSeconds })
      .returning();
    return created;
  },
};
