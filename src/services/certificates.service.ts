import { eq, and, desc } from "drizzle-orm";
import { db } from "@/config/database";
import { certificates, courses, users } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { randomToken } from "@/utils/crypto";

function generateCertificateNumber(): string {
  const raw = randomToken(4).toUpperCase();
  return `CERT-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export const certificatesService = {
  async issue(userId: string, courseId: string) {
    const [existing] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
      .limit(1);

    if (existing) return existing;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const [created] = await db
          .insert(certificates)
          .values({ userId, courseId, certificateNumber: generateCertificateNumber() })
          .returning();
        if (created) return created;
      } catch {
        const [row] = await db
          .select()
          .from(certificates)
          .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
          .limit(1);
        if (row) return row;
      }
    }

    throw ApiError.internal("Sertifika oluşturulamadı");
  },

  async listByUser(userId: string) {
    const rows = await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        course: {
          id: courses.id,
          slug: courses.slug,
          title: courses.title,
          thumbnail: courses.thumbnail,
        },
        instructor: {
          id: users.id,
          name: users.name,
        },
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));

    return rows;
  },

  async getByNumber(certificateNumber: string) {
    const [row] = await db
      .select({
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        recipientName: users.name,
        course: {
          id: courses.id,
          slug: courses.slug,
          title: courses.title,
        },
      })
      .from(certificates)
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.certificateNumber, certificateNumber))
      .limit(1);

    if (!row) throw ApiError.notFound("Sertifika bulunamadı");
    return row;
  },

  async getByUserAndCourse(userId: string, courseId: string) {
    const [row] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
      .limit(1);
    return row ?? null;
  },
};
