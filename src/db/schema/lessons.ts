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
import { LESSON_TYPES } from "@/config/constants";

export const lessonTypeEnum = pgEnum("lesson_type", LESSON_TYPES);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    type: lessonTypeEnum("type").notNull().default("video"),
    order: integer("order").notNull().default(0),
    duration: integer("duration").notNull().default(0), // saniye
    videoUrl: text("video_url"),
    content: text("content"), // article için markdown
    isFree: boolean("is_free").notNull().default(false), // önizleme
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    sectionIdx: index("lessons_section_idx").on(table.sectionId),
  }),
);

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
