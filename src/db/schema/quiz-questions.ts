import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { quizzes } from "./quizzes";
import { QUESTION_TYPES } from "@/config/constants";

export const questionTypeEnum = pgEnum("question_type", QUESTION_TYPES);

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    type: questionTypeEnum("type").notNull(),
    text: text("text").notNull(),
    explanation: text("explanation"),
    points: integer("points").notNull().default(1),
    order: integer("order").notNull().default(0),
    // open_ended sorular için referans cevap (manuel/eşleşmeli puanlama için)
    correctAnswer: text("correct_answer"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    quizIdx: index("quiz_questions_quiz_idx").on(table.quizId),
  }),
);

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;
