import { eq, and, desc, asc, ilike, gte, lte, count, sql, type SQL } from "drizzle-orm";
import { db } from "@/config/database";
import { courses, categories, users, workspaces, sections, lessons } from "@/db/schema";
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
  async list(filters: CourseFilterInput, viewer?: { role: Role }) {
    const { page, limit, offset } = getPagination({
      page: filters.page,
      limit: filters.limit,
    });

    const where: SQL[] = [];
    // Admin draft kursları da görür; diğer herkese sadece published
    if (viewer?.role !== "admin") {
      where.push(eq(courses.isPublished, true));
    }
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
        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .leftJoin(workspaces, eq(courses.workspaceId, workspaces.id))
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
      data: data.map((row) => ({
        ...row.course,
        category: row.category,
        instructor: row.instructor,
        workspace: row.workspace,
      })),
      meta: buildPaginationMeta(page, limit, Number(total)),
    };
  },

  async listByInstructor(instructorId: string) {
    const data = await db
      .select({
        course: courses,
        category: categories,
        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(workspaces, eq(courses.workspaceId, workspaces.id))
      .where(eq(courses.instructorId, instructorId))
      .orderBy(desc(courses.updatedAt));

    return data.map((row) => ({
      ...row.course,
      category: row.category,
      workspace: row.workspace,
    }));
  },

  async getById(id: string) {
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
        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .leftJoin(workspaces, eq(courses.workspaceId, workspaces.id))
      .where(eq(courses.id, id))
      .limit(1);

    if (!row) throw ApiError.notFound("Kurs bulunamadı");

    return {
      ...row.course,
      category: row.category,
      instructor: row.instructor,
      workspace: row.workspace,
    };
  },

  async getCurriculum(courseId: string, actor: { id: string; role: Role }) {
    const [course] = await db
      .select({ id: courses.id, instructorId: courses.instructorId })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) throw ApiError.notFound("Kurs bulunamadı");
    if (course.instructorId !== actor.id && actor.role !== "admin") {
      throw ApiError.forbidden("Bu kursu görüntüleme yetkiniz yok");
    }

    const sectionRows = await db
      .select()
      .from(sections)
      .where(eq(sections.courseId, courseId))
      .orderBy(asc(sections.order), asc(sections.createdAt));

    const lessonRows = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.order), asc(lessons.createdAt));

    return {
      sections: sectionRows.map((s) => ({
        ...s,
        lessons: lessonRows.filter((l) => l.sectionId === s.id),
      })),
      unassignedLessons: lessonRows.filter((l) => l.sectionId === null),
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
        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .leftJoin(workspaces, eq(courses.workspaceId, workspaces.id))
      .where(eq(courses.slug, slug))
      .limit(1);

    if (!row) throw ApiError.notFound("Kurs bulunamadı");

    return {
      ...row.course,
      category: row.category,
      instructor: row.instructor,
      workspace: row.workspace,
    };
  },

  async create(callerId: string, input: CreateCourseInput) {
    const [caller] = await db
      .select({
        id: users.id,
        role: users.role,
        workspaceId: users.workspaceId,
      })
      .from(users)
      .where(eq(users.id, callerId))
      .limit(1);
    if (!caller) throw ApiError.unauthorized();

    let workspaceId: string;
    let instructorId: string;

    if (caller.role === "admin") {
      if (!input.workspaceId) {
        throw ApiError.badRequest("Admin için workspaceId zorunlu");
      }
      if (!input.instructorId) {
        throw ApiError.badRequest("Admin için instructorId zorunlu");
      }
      const [ws] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.id, input.workspaceId))
        .limit(1);
      if (!ws) throw ApiError.badRequest("Workspace bulunamadı");

      const [target] = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.id, input.instructorId),
            eq(users.workspaceId, input.workspaceId),
          ),
        )
        .limit(1);
      if (!target) {
        throw ApiError.badRequest(
          "Atanan eğitmen bu workspace'in üyesi olmalı",
        );
      }
      workspaceId = input.workspaceId;
      instructorId = target.id;
    } else {
      if (!caller.workspaceId) {
        throw ApiError.forbidden(
          "Kurs oluşturmak için önce bir workspace oluşturun",
        );
      }
      workspaceId = caller.workspaceId;
      instructorId = callerId;

      if (input.instructorId && input.instructorId !== callerId) {
        const [workspace] = await db
          .select({ ownerId: workspaces.ownerId })
          .from(workspaces)
          .where(eq(workspaces.id, caller.workspaceId))
          .limit(1);
        if (!workspace || workspace.ownerId !== callerId) {
          throw ApiError.forbidden(
            "Başka bir kullanıcıya kurs atamak için workspace sahibi olmalısınız",
          );
        }
        const [target] = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.id, input.instructorId),
              eq(users.workspaceId, caller.workspaceId),
            ),
          )
          .limit(1);
        if (!target) {
          throw ApiError.badRequest(
            "Atanan eğitmen bu workspace'in üyesi olmalı",
          );
        }
        instructorId = target.id;
      }
    }

    const { instructorId: _i, workspaceId: _w, ...rest } = input;
    const slug = slugify(input.title);
    const [course] = await db
      .insert(courses)
      .values({
        ...rest,
        slug,
        price: input.price.toString(),
        instructorId,
        workspaceId,
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
    if (existing.isPublished && actor.role !== "admin") {
      throw ApiError.forbidden(
        "Yayındaki kurs silinemez. Önce yayından kaldırın.",
      );
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
