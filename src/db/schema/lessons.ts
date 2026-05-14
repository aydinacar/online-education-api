import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sections } from "./sections";
import { courses } from "./courses";
import { LESSON_TYPES } from "@/config/constants";

export const lessonTypeEnum = pgEnum("lesson_type", LESSON_TYPES);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => sections.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 200 }).notNull(),
    type: lessonTypeEnum("type").notNull().default("video"),
    order: integer("order").notNull().default(0),
    duration: integer("duration").notNull().default(0), // saniye
    videoUrl: text("video_url"),
    content: text("content"), // article için markdown
    isFree: boolean("is_free").notNull().default(false), // önizleme

    // Canlı ders alanları (type = 'live' iken kullanılır)
    scheduledAt: timestamp("scheduled_at"),
    meetingUrl: text("meeting_url"),
    recordingUrl: text("recording_url"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    courseIdx: index("lessons_course_idx").on(table.courseId),
    sectionIdx: index("lessons_section_idx").on(table.sectionId),
  }),
);

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
