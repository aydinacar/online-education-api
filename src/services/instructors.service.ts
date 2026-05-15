import { eq, and, desc, asc, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "@/config/database";
import { users, courses, workspaces, categories } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { getPagination, buildPaginationMeta } from "@/utils/pagination";
import { ROLES } from "@/config/constants";
import type { InstructorFilterInput } from "@/validations/instructor.schema";

const courseCountSql = sql<number>`COUNT(${courses.id}) FILTER (WHERE ${courses.isPublished})::int`;
const studentCountSql = sql<number>`COALESCE(SUM(${courses.studentCount}) FILTER (WHERE ${courses.isPublished}), 0)::int`;
const reviewCountSql = sql<number>`COALESCE(SUM(${courses.reviewCount}) FILTER (WHERE ${courses.isPublished}), 0)::int`;
const avgRatingSql = sql<number>`COALESCE(AVG(${courses.rating}) FILTER (WHERE ${courses.isPublished} AND ${courses.reviewCount} > 0), 0)::float`;

export const instructorsService = {
  async list(filters: InstructorFilterInput) {
    const { page, limit, offset } = getPagination({
      page: filters.page,
      limit: filters.limit,
    });

    const where: SQL[] = [eq(users.role, ROLES.INSTRUCTOR)];
    if (filters.search) {
      where.push(ilike(users.name, `%${filters.search}%`));
    }

    const orderBy = (() => {
      switch (filters.sort) {
        case "rating":
          return desc(avgRatingSql);
        case "courses":
          return desc(courseCountSql);
        case "newest":
          return desc(users.createdAt);
        case "popular":
        default:
          return desc(studentCountSql);
      }
    })();

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        bio: users.bio,
        headline: users.headline,
        website: users.website,
        twitter: users.twitter,
        linkedin: users.linkedin,
        createdAt: users.createdAt,
        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
        courseCount: courseCountSql,
        studentCount: studentCountSql,
        reviewCount: reviewCountSql,
        avgRating: avgRatingSql,
      })
      .from(users)
      .leftJoin(courses, eq(courses.instructorId, users.id))
      .leftJoin(workspaces, eq(users.workspaceId, workspaces.id))
      .where(and(...where))
      .groupBy(users.id, workspaces.id)
      .orderBy(orderBy, asc(users.name))
      .limit(limit)
      .offset(offset);

    const [totalRow] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(users)
      .where(and(...where));

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        bio: row.bio,
        headline: row.headline,
        website: row.website,
        twitter: row.twitter,
        linkedin: row.linkedin,
        createdAt: row.createdAt,
        workspace: row.workspace?.id ? row.workspace : null,
        stats: {
          courseCount: row.courseCount,
          studentCount: row.studentCount,
          reviewCount: row.reviewCount,
          avgRating: Number(row.avgRating.toFixed(2)),
        },
      })),
      meta: buildPaginationMeta(page, limit, totalRow?.total ?? 0),
    };
  },

  async getById(id: string) {
    const [row] = await db
      .select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        bio: users.bio,
        headline: users.headline,
        website: users.website,
        twitter: users.twitter,
        linkedin: users.linkedin,
        createdAt: users.createdAt,
        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
        courseCount: courseCountSql,
        studentCount: studentCountSql,
        reviewCount: reviewCountSql,
        avgRating: avgRatingSql,
      })
      .from(users)
      .leftJoin(courses, eq(courses.instructorId, users.id))
      .leftJoin(workspaces, eq(users.workspaceId, workspaces.id))
      .where(and(eq(users.id, id), eq(users.role, ROLES.INSTRUCTOR)))
      .groupBy(users.id, workspaces.id)
      .limit(1);

    if (!row) throw ApiError.notFound("Eğitmen bulunamadı");

    const instructorCourses = await db
      .select({
        course: courses,
        category: { id: categories.id, name: categories.name, slug: categories.slug },
        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(workspaces, eq(courses.workspaceId, workspaces.id))
      .where(and(eq(courses.instructorId, id), eq(courses.isPublished, true)))
      .orderBy(desc(courses.studentCount), desc(courses.createdAt));

    const instructorRef = {
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      headline: row.headline,
    };

    return {
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      bio: row.bio,
      headline: row.headline,
      website: row.website,
      twitter: row.twitter,
      linkedin: row.linkedin,
      createdAt: row.createdAt,
      workspace: row.workspace?.id ? row.workspace : null,
      stats: {
        courseCount: row.courseCount,
        studentCount: row.studentCount,
        reviewCount: row.reviewCount,
        avgRating: Number(row.avgRating.toFixed(2)),
      },
      courses: instructorCourses.map((c) => ({
        ...c.course,
        price: Number(c.course.price),
        rating: Number(c.course.rating),
        category: c.category,
        workspace: c.workspace,
        instructor: instructorRef,
      })),
    };
  },
};
