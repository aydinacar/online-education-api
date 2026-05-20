import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { quizQuestions } from "./quiz-questions";

export const quizOptions = pgTable(
  "quiz_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    questionIdx: index("quiz_options_question_idx").on(table.questionId),
  }),
);

export type QuizOption = typeof quizOptions.$inferSelect;
export type NewQuizOption = typeof quizOptions.$inferInsert;
