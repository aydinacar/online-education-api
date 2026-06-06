import { pgTable, uuid, varchar, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";

/**
 * Kurs tamamlanınca üretilen sertifikalar.
 * certificateNumber genel doğrulama için kullanılan benzersiz, paylaşılabilir koddur.
 */
export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    certificateNumber: varchar("certificate_number", { length: 32 }).notNull().unique(),
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userCourseUnique: uniqueIndex("certificates_user_course_unique").on(
      table.userId,
      table.courseId,
    ),
    userIdx: index("certificates_user_idx").on(table.userId),
  }),
);

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
