import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const INSTRUCTOR_APPLICATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export type InstructorApplicationStatus =
  (typeof INSTRUCTOR_APPLICATION_STATUSES)[number];

export const instructorApplicationStatusEnum = pgEnum(
  "instructor_application_status",
  INSTRUCTOR_APPLICATION_STATUSES,
);

export const instructorApplications = pgTable(
  "instructor_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    headline: varchar("headline", { length: 200 }).notNull(),
    bio: text("bio").notNull(),
    expertiseAreas: text("expertise_areas").array().notNull(),
    diplomaUrl: text("diploma_url").notNull(),
    certificateUrls: text("certificate_urls").array(),
    sampleSyllabus: text("sample_syllabus"),
    portfolioUrl: text("portfolio_url"),

    status: instructorApplicationStatusEnum("status").notNull().default("pending"),
    reviewNote: text("review_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("instructor_applications_user_idx").on(table.userId),
    statusIdx: index("instructor_applications_status_idx").on(table.status),
  }),
);

export type InstructorApplication = typeof instructorApplications.$inferSelect;
export type NewInstructorApplication =
  typeof instructorApplications.$inferInsert;
