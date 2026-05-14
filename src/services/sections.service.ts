import { eq, and, asc, max, inArray } from "drizzle-orm";
import { db } from "@/config/database";
import { sections, courses } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import type { Role } from "@/config/constants";
import type {
  CreateSectionInput,
  UpdateSectionInput,
  ReorderSectionsInput,
} from "@/validations/section.schema";

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

async function assertSectionOwnership(
  sectionId: string,
  actor: { id: string; role: Role },
) {
  const [row] = await db
    .select({
      courseId: sections.courseId,
      instructorId: courses.instructorId,
    })
    .from(sections)
    .innerJoin(courses, eq(sections.courseId, courses.id))
    .where(eq(sections.id, sectionId))
    .limit(1);

  if (!row) throw ApiError.notFound("Bölüm bulunamadı");
  if (row.instructorId !== actor.id && actor.role !== "admin") {
    throw ApiError.forbidden("Bu bölüm üzerinde işlem yapma yetkiniz yok");
  }
  return row;
}

export const sectionsService = {
  async listByCourse(courseId: string) {
    return db
      .select()
      .from(sections)
      .where(eq(sections.courseId, courseId))
      .orderBy(asc(sections.order), asc(sections.createdAt));
  },

  async create(input: CreateSectionInput, actor: { id: string; role: Role }) {
    await assertCourseOwnership(input.courseId, actor);

    let order = input.order;
    if (order === undefined) {
      const [row] = await db
        .select({ value: max(sections.order) })
        .from(sections)
        .where(eq(sections.courseId, input.courseId));
      order = (row?.value ?? -1) + 1;
    }

    const [section] = await db
      .insert(sections)
      .values({ courseId: input.courseId, title: input.title, order })
      .returning();
    return section;
  },

  async update(
    id: string,
    input: UpdateSectionInput,
    actor: { id: string; role: Role },
  ) {
    await assertSectionOwnership(id, actor);

    const [section] = await db
      .update(sections)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(sections.id, id))
      .returning();
    return section;
  },

  async delete(id: string, actor: { id: string; role: Role }) {
    await assertSectionOwnership(id, actor);
    await db.delete(sections).where(eq(sections.id, id));
  },

  async reorder(input: ReorderSectionsInput, actor: { id: string; role: Role }) {
    await assertCourseOwnership(input.courseId, actor);

    const ids = input.items.map((i) => i.id);
    const existing = await db
      .select({ id: sections.id })
      .from(sections)
      .where(and(eq(sections.courseId, input.courseId), inArray(sections.id, ids)));

    if (existing.length !== ids.length) {
      throw ApiError.badRequest("Bazı bölümler bu kursa ait değil");
    }

    await db.transaction(async (tx) => {
      for (const item of input.items) {
        await tx
          .update(sections)
          .set({ order: item.order, updatedAt: new Date() })
          .where(eq(sections.id, item.id));
      }
    });

    return this.listByCourse(input.courseId);
  },
};
