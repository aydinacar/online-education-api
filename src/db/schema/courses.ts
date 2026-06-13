import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  numeric,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";
import { workspaces } from "./workspaces";
import { COURSE_LEVELS } from "@/config/constants";

export const courseLevelEnum = pgEnum("course_level", COURSE_LEVELS);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    shortDescription: varchar("short_description", { length: 300 }),
    description: text("description").notNull(),
    thumbnail: text("thumbnail"),
    level: courseLevelEnum("level").notNull().default("beginner"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),

    studentCount: integer("student_count").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
    totalDuration: integer("total_duration").notNull().default(0),
    lessonCount: integer("lesson_count").notNull().default(0),

    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at"),

    instructorId: uuid("instructor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),

    whatYouWillLearn: text("what_you_will_learn").array(),
    requirements: text("requirements").array(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    instructorIdx: index("courses_instructor_idx").on(table.instructorId),
    categoryIdx: index("courses_category_idx").on(table.categoryId),
    workspaceIdx: index("courses_workspace_idx").on(table.workspaceId),
    publishedIdx: index("courses_published_idx").on(table.isPublished),
  }),
);

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
