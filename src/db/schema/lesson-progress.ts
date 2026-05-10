import { pgTable, uuid, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { lessons } from "./lessons";

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    watchedSeconds: integer("watched_seconds").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    lastWatchedAt: timestamp("last_watched_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userLessonUnique: uniqueIndex("lesson_progress_user_lesson_unique").on(
      table.userId,
      table.lessonId,
    ),
  }),
);

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;
