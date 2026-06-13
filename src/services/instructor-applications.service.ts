import { eq, desc, count, and, type SQL } from "drizzle-orm";
import { db } from "@/config/database";
import { instructorApplications, users } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { getPagination, buildPaginationMeta } from "@/utils/pagination";
import { ROLES, type Role } from "@/config/constants";
import type {
  CreateInstructorApplicationInput,
  ListInstructorApplicationsInput,
  ReviewInstructorApplicationInput,
} from "@/validations/instructor-application.schema";

const applicantColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  avatar: users.avatar,
  role: users.role,
} as const;

export const instructorApplicationsService = {
  async list(filters: ListInstructorApplicationsInput) {
    const { page, limit, offset } = getPagination({
      page: filters.page,
      limit: filters.limit,
    });

    const where: SQL[] = [];
    if (filters.status) {
      where.push(eq(instructorApplications.status, filters.status));
    }

    const data = await db
      .select({
        application: instructorApplications,
        user: applicantColumns,
      })
      .from(instructorApplications)
      .leftJoin(users, eq(instructorApplications.userId, users.id))
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(instructorApplications.createdAt))
      .limit(limit)
      .offset(offset);

    const totalRows = await db
      .select({ total: count() })
      .from(instructorApplications)
      .where(where.length ? and(...where) : undefined);
    const total = totalRows[0]?.total ?? 0;

    return {
      data: data.map((row) => ({ ...row.application, user: row.user })),
      meta: buildPaginationMeta(page, limit, Number(total)),
    };
  },

  async getById(id: string) {
    const [row] = await db
      .select({
        application: instructorApplications,
        user: applicantColumns,
      })
      .from(instructorApplications)
      .leftJoin(users, eq(instructorApplications.userId, users.id))
      .where(eq(instructorApplications.id, id))
      .limit(1);
    if (!row) throw ApiError.notFound("Başvuru bulunamadı");
    return { ...row.application, user: row.user };
  },

  async getMine(userId: string) {
    const [row] = await db
      .select()
      .from(instructorApplications)
      .where(eq(instructorApplications.userId, userId))
      .orderBy(desc(instructorApplications.createdAt))
      .limit(1);
    return row ?? null;
  },

  async create(userId: string, input: CreateInstructorApplicationInput) {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw ApiError.notFound("Kullanıcı bulunamadı");

    if (user.role === ROLES.INSTRUCTOR || user.role === ROLES.ADMIN) {
      throw ApiError.conflict("Zaten eğitmensin");
    }

    const existing = await db
      .select({ id: instructorApplications.id, status: instructorApplications.status })
      .from(instructorApplications)
      .where(eq(instructorApplications.userId, userId))
      .orderBy(desc(instructorApplications.createdAt))
      .limit(1);

    if (existing[0]?.status === "pending") {
      throw ApiError.conflict("Zaten incelemede bekleyen bir başvurun var");
    }

    const [row] = await db
      .insert(instructorApplications)
      .values({
        userId,
        headline: input.headline,
        bio: input.bio,
        expertiseAreas: input.expertiseAreas,
        diplomaUrl: input.diplomaUrl,
        certificateUrls: input.certificateUrls,
        sampleSyllabus: input.sampleSyllabus,
        portfolioUrl: input.portfolioUrl,
      })
      .returning();
    if (!row) throw ApiError.internal("Başvuru oluşturulamadı");
    return row;
  },

  async approve(
    id: string,
    reviewer: { id: string; role: Role },
    input: ReviewInstructorApplicationInput,
  ) {
    if (reviewer.role !== ROLES.ADMIN) {
      throw ApiError.forbidden("Sadece admin onaylayabilir");
    }

    const [existing] = await db
      .select()
      .from(instructorApplications)
      .where(eq(instructorApplications.id, id))
      .limit(1);
    if (!existing) throw ApiError.notFound("Başvuru bulunamadı");
    if (existing.status !== "pending") {
      throw ApiError.conflict("Bu başvuru zaten sonuçlanmış");
    }

    return db.transaction(async (tx) => {
      const [app] = await tx
        .update(instructorApplications)
        .set({
          status: "approved",
          reviewNote: input.reviewNote,
          reviewedBy: reviewer.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(instructorApplications.id, id))
        .returning();

      await tx
        .update(users)
        .set({ role: ROLES.INSTRUCTOR, updatedAt: new Date() })
        .where(eq(users.id, existing.userId));

      return app!;
    });
  },

  async reject(
    id: string,
    reviewer: { id: string; role: Role },
    input: ReviewInstructorApplicationInput,
  ) {
    if (reviewer.role !== ROLES.ADMIN) {
      throw ApiError.forbidden("Sadece admin reddedebilir");
    }
    if (!input.reviewNote || input.reviewNote.trim().length < 5) {
      throw ApiError.badRequest("Reddetmek için sebep yazın");
    }

    const [existing] = await db
      .select({ status: instructorApplications.status })
      .from(instructorApplications)
      .where(eq(instructorApplications.id, id))
      .limit(1);
    if (!existing) throw ApiError.notFound("Başvuru bulunamadı");
    if (existing.status !== "pending") {
      throw ApiError.conflict("Bu başvuru zaten sonuçlanmış");
    }

    const [row] = await db
      .update(instructorApplications)
      .set({
        status: "rejected",
        reviewNote: input.reviewNote,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(instructorApplications.id, id))
      .returning();
    return row!;
  },
};
