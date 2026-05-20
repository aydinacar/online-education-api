import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { quizzes } from "./quizzes";

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    score: integer("score"), // yüzde (0-100), submit edilince yazılır
    earnedPoints: integer("earned_points"),
    totalPoints: integer("total_points"),
    passed: boolean("passed"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    submittedAt: timestamp("submitted_at"),
  },
  (table) => ({
    userQuizIdx: index("quiz_attempts_user_quiz_idx").on(table.userId, table.quizId),
  }),
);

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;
