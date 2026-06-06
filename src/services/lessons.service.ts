import { eq, and, asc, max, inArray, isNull } from "drizzle-orm";
import { db } from "@/config/database";
import { lessons, sections, courses, lessonProgress } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { enrollmentsService } from "./enrollments.service";
import type { Role } from "@/config/constants";
import type {
  CreateLessonInput,
  UpdateLessonInput,
  ReorderLessonsInput,
} from "@/validations/lesson.schema";

async function assertCourseOwnership(
  courseId: string,
  actor: { id: string; role: Role },
) {
  const [row] = await db
    .select({ instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!row) throw ApiError.notFound("Kurs bulunamadı");
  if (row.instructorId !== actor.id && actor.role !== "admin") {
    throw ApiError.forbidden("Bu kurs üzerinde işlem yapma yetkiniz yok");
  }
}

async function assertLessonOwnership(
  lessonId: string,
  actor: { id: string; role: Role },
) {
  const [row] = await db
    .select({
      courseId: lessons.courseId,
      instructorId: courses.instructorId,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!row) throw ApiError.notFound("Ders bulunamadı");
  if (row.instructorId !== actor.id && actor.role !== "admin") {
    throw ApiError.forbidden("Bu ders üzerinde işlem yapma yetkiniz yok");
  }
  return row;
}

async function assertSectionBelongsToCourse(sectionId: string, courseId: string) {
  const [row] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.courseId, courseId)))
    .limit(1);
  if (!row) throw ApiError.badRequest("Bölüm bu kursa ait değil");
}

export const lessonsService = {
  async getById(id: string) {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    if (!lesson) throw ApiError.notFound("Ders bulunamadı");
    return lesson;
  },

  async getByCourse(courseId: string) {
    return db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.order), asc(lessons.createdAt));
  },

  async create(input: CreateLessonInput, actor: { id: string; role: Role }) {
    await assertCourseOwnership(input.courseId, actor);
    if (input.sectionId) {
      await assertSectionBelongsToCourse(input.sectionId, input.courseId);
    }

    // Order verilmemişse aynı section (veya unassigned havuzu) içinde en sona ekle
    let order = input.order;
    if (order === undefined) {
      const [row] = await db
        .select({ value: max(lessons.order) })
        .from(lessons)
        .where(
          and(
            eq(lessons.courseId, input.courseId),
            input.sectionId
              ? eq(lessons.sectionId, input.sectionId)
              : isNull(lessons.sectionId),
          ),
        );
      order = (row?.value ?? -1) + 1;
    }

    const [lesson] = await db
      .insert(lessons)
      .values({ ...input, sectionId: input.sectionId ?? null, order })
      .returning();
    return lesson;
  },

  async update(
    id: string,
    input: UpdateLessonInput,
    actor: { id: string; role: Role },
  ) {
    const owned = await assertLessonOwnership(id, actor);
    if (input.sectionId) {
      await assertSectionBelongsToCourse(input.sectionId, owned.courseId);
    }

    const [lesson] = await db
      .update(lessons)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return lesson;
  },

  async delete(id: string, actor: { id: string; role: Role }) {
    await assertLessonOwnership(id, actor);
    await db.delete(lessons).where(eq(lessons.id, id));
  },

  async reorder(input: ReorderLessonsInput, actor: { id: string; role: Role }) {
    await assertCourseOwnership(input.courseId, actor);

    const lessonIds = input.items.map((i) => i.id);
    const existing = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(and(eq(lessons.courseId, input.courseId), inArray(lessons.id, lessonIds)));
    if (existing.length !== lessonIds.length) {
      throw ApiError.badRequest("Bazı dersler bu kursa ait değil");
    }

    const sectionIds = Array.from(
      new Set(
        input.items
          .map((i) => i.sectionId)
          .filter((id): id is string => id !== null),
      ),
    );
    if (sectionIds.length > 0) {
      const validSections = await db
        .select({ id: sections.id })
        .from(sections)
        .where(
          and(eq(sections.courseId, input.courseId), inArray(sections.id, sectionIds)),
        );
      if (validSections.length !== sectionIds.length) {
        throw ApiError.badRequest("Bazı bölümler bu kursa ait değil");
      }
    }

    await db.transaction(async (tx) => {
      for (const item of input.items) {
        await tx
          .update(lessons)
          .set({
            sectionId: item.sectionId,
            order: item.order,
            updatedAt: new Date(),
          })
          .where(eq(lessons.id, item.id));
      }
    });

    return this.getByCourse(input.courseId);
  },

  async markCompleted(userId: string, lessonId: string) {
    const [lesson] = await db
      .select({ courseId: lessons.courseId })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (!lesson) throw ApiError.notFound("Ders bulunamadı");

    const [existing] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
      .limit(1);

    let result;
    if (existing) {
      [result] = await db
        .update(lessonProgress)
        .set({ isCompleted: true, completedAt: new Date(), lastWatchedAt: new Date() })
        .where(eq(lessonProgress.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(lessonProgress)
        .values({
          userId,
          lessonId,
          isCompleted: true,
          completedAt: new Date(),
        })
        .returning();
    }

    // Kurs ilerlemesini güncelle; %100'de sertifika otomatik üretilir.
    await enrollmentsService.recalculateProgress(userId, lesson.courseId);

    return result;
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
