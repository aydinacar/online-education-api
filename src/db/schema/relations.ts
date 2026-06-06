import { relations } from "drizzle-orm";
import { users } from "./users";
import { refreshTokens } from "./refresh-tokens";
import { verificationTokens } from "./verification-tokens";
import { categories } from "./categories";
import { courses } from "./courses";
import { sections } from "./sections";
import { lessons } from "./lessons";
import { enrollments } from "./enrollments";
import { lessonProgress } from "./lesson-progress";
import { reviews } from "./reviews";
import { payments } from "./payments";
import { workspaces } from "./workspaces";
import { instructorApplications } from "./instructor-applications";
import { quizzes } from "./quizzes";
import { quizQuestions } from "./quiz-questions";
import { quizOptions } from "./quiz-options";
import { quizAttempts } from "./quiz-attempts";
import { quizAnswers } from "./quiz-answers";

export const usersRelations = relations(users, ({ one, many }) => ({
  refreshTokens: many(refreshTokens),
  verificationTokens: many(verificationTokens),
  coursesAsInstructor: many(courses),
  enrollments: many(enrollments),
  reviews: many(reviews),
  payments: many(payments),
  lessonProgress: many(lessonProgress),
  workspace: one(workspaces, {
    fields: [users.workspaceId],
    references: [workspaces.id],
    relationName: "workspaceMembers",
  }),
  ownedWorkspaces: many(workspaces, { relationName: "workspaceOwner" }),
  instructorApplications: many(instructorApplications, {
    relationName: "applicant",
  }),
}));

export const instructorApplicationsRelations = relations(
  instructorApplications,
  ({ one }) => ({
    user: one(users, {
      fields: [instructorApplications.userId],
      references: [users.id],
      relationName: "applicant",
    }),
    reviewer: one(users, {
      fields: [instructorApplications.reviewedBy],
      references: [users.id],
    }),
  }),
);

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
    relationName: "workspaceOwner",
  }),
  members: many(users, { relationName: "workspaceMembers" }),
  courses: many(courses),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const verificationTokensRelations = relations(verificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [verificationTokens.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  workspace: one(workspaces, {
    fields: [courses.workspaceId],
    references: [workspaces.id],
  }),
  sections: many(sections),
  enrollments: many(enrollments),
  reviews: many(reviews),
  payments: many(payments),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  course: one(courses, {
    fields: [sections.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  section: one(sections, {
    fields: [lessons.sectionId],
    references: [sections.id],
  }),
  progress: many(lessonProgress),
  quiz: one(quizzes, {
    fields: [lessons.id],
    references: [quizzes.lessonId],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, {
    fields: [lessonProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [reviews.courseId],
    references: [courses.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [payments.courseId],
    references: [courses.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  options: many(quizOptions),
  answers: many(quizAnswers),
}));

export const quizOptionsRelations = relations(quizOptions, ({ one }) => ({
  question: one(quizQuestions, {
    fields: [quizOptions.questionId],
    references: [quizQuestions.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  answers: many(quizAnswers),
}));

export const quizAnswersRelations = relations(quizAnswers, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizAnswers.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(quizQuestions, {
    fields: [quizAnswers.questionId],
    references: [quizQuestions.id],
  }),
}));
