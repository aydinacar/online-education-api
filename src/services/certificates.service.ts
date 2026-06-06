import { eq, and, desc } from "drizzle-orm";
import { db } from "@/config/database";
import { certificates, courses, users } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { randomToken } from "@/utils/crypto";

/**
 * "CERT-XXXX-XXXX" biçiminde okunabilir, benzersiz bir sertifika numarası üretir.
 */
function generateCertificateNumber(): string {
  const raw = randomToken(4).toUpperCase(); // 8 hex karakter
  return `CERT-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export const certificatesService = {
  /**
   * Kullanıcı + kurs için sertifika üretir. Idempotent - varsa mevcut olanı döner.
   */
  async issue(userId: string, courseId: string) {
    const [existing] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
      .limit(1);

    if (existing) return existing;

    // Numara çakışması çok düşük ihtimal; birkaç kez dene.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const [created] = await db
          .insert(certificates)
          .values({ userId, courseId, certificateNumber: generateCertificateNumber() })
          .returning();
        if (created) return created;
      } catch {
        // unique ihlali (number veya user+course) - tekrar dene / mevcut olanı al
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

  /**
   * Kullanıcının sertifikaları (kurs + eğitmen bilgisiyle).
   */
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

  /**
   * Numara ile genel doğrulama. Kullanıcı adı, kurs ve tarih döner.
   */
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

  /**
   * Belirli bir kurs için kullanıcının sertifikasını döner (yoksa null).
   */
  async getByUserAndCourse(userId: string, courseId: string) {
    const [row] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
      .limit(1);
    return row ?? null;
  },
};
