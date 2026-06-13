import { pgTable, uuid, timestamp, numeric, uniqueIndex, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    progress: integer("progress").notNull().default(0),
    completedAt: timestamp("completed_at"),
    enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  },
  (table) => ({
    userCourseUnique: uniqueIndex("enrollments_user_course_unique").on(
      table.userId,
      table.courseId,
    ),
  }),
);

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
