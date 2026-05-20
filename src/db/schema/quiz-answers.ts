import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { quizAttempts } from "./quiz-attempts";
import { quizQuestions } from "./quiz-questions";

export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    // single/multiple/true_false için seçilen seçenek ID'leri
    selectedOptionIds: jsonb("selected_option_ids")
      .$type<string[]>()
      .notNull()
      .default([]),
    // open_ended için serbest metin yanıt
    textAnswer: text("text_answer"),
    isCorrect: boolean("is_correct"), // open_ended için manuel puanlamaya kadar null
    pointsEarned: integer("points_earned").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    attemptQuestionUnique: uniqueIndex("quiz_answers_attempt_question_unique").on(
      table.attemptId,
      table.questionId,
    ),
  }),
);

export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type NewQuizAnswer = typeof quizAnswers.$inferInsert;
