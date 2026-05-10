import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { courses } from "./courses";

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    courseIdx: index("sections_course_idx").on(table.courseId),
  }),
);

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
