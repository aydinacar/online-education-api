import { eq, and, asc, desc, count, isNull, inArray } from "drizzle-orm";
import { db } from "@/config/database";
import {
  quizzes,
  quizQuestions,
  quizOptions,
  quizAttempts,
  quizAnswers,
  lessons,
  courses,
  enrollments,
} from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import type { Role } from "@/config/constants";
import type {
  CreateQuizInput,
  UpdateQuizInput,
  SubmitAttemptInput,
  QuestionInput,
} from "@/validations/quiz.schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function assertLessonOwnership(
  lessonId: string,
  actor: { id: string; role: Role },
) {
  const [row] = await db
    .select({
      lessonId: lessons.id,
      courseId: lessons.courseId,
      instructorId: courses.instructorId,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!row) throw ApiError.notFound("Ders bulunamadı");
  if (row.instructorId !== actor.id && actor.role !== "admin") {
    throw ApiError.forbidden("Bu ders üzerinde işlem yapma yetkiniz yok");
  }
  return row;
}

async function assertQuizOwnership(quizId: string, actor: { id: string; role: Role }) {
  const [row] = await db
    .select({
      quizId: quizzes.id,
      lessonId: quizzes.lessonId,
      courseId: lessons.courseId,
      instructorId: courses.instructorId,
    })
    .from(quizzes)
    .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(quizzes.id, quizId))
    .limit(1);

  if (!row) throw ApiError.notFound("Quiz bulunamadı");
  if (row.instructorId !== actor.id && actor.role !== "admin") {
    throw ApiError.forbidden("Bu quiz üzerinde işlem yapma yetkiniz yok");
  }
  return row;
}

async function assertEnrolledOrInstructor(
  quizId: string,
  actor: { id: string; role: Role },
) {
  const [row] = await db
    .select({
      quizId: quizzes.id,
      courseId: lessons.courseId,
      instructorId: courses.instructorId,
    })
    .from(quizzes)
    .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(quizzes.id, quizId))
    .limit(1);

  if (!row) throw ApiError.notFound("Quiz bulunamadı");

  if (actor.role === "admin" || row.instructorId === actor.id) return row;

  const [enrolled] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, actor.id), eq(enrollments.courseId, row.courseId)),
    )
    .limit(1);

  if (!enrolled) throw ApiError.forbidden("Bu quiz'i çözebilmek için kursa kayıt olun");
  return row;
}

async function insertQuestionsTree(
  tx: Tx,
  quizId: string,
  questions: QuestionInput[],
) {
  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi]!;
    const [question] = await tx
      .insert(quizQuestions)
      .values({
        quizId,
        type: q.type,
        text: q.text,
        explanation: q.explanation,
        points: q.points,
        order: q.order ?? qi,
        correctAnswer: q.type === "open_ended" ? (q.correctAnswer ?? null) : null,
      })
      .returning();

    if (!question) throw ApiError.internal("Soru oluşturulamadı");

    if (q.options.length > 0) {
      await tx.insert(quizOptions).values(
        q.options.map((o, oi) => ({
          questionId: question.id,
          text: o.text,
          isCorrect: o.isCorrect,
          order: o.order ?? oi,
        })),
      );
    }
  }
}

type QuizDetail = {
  quiz: typeof quizzes.$inferSelect;
  questions: Array<
    typeof quizQuestions.$inferSelect & {
      options: (typeof quizOptions.$inferSelect)[];
    }
  >;
};

async function loadQuizDetail(quizId: string): Promise<QuizDetail> {
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  if (!quiz) throw ApiError.notFound("Quiz bulunamadı");

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(asc(quizQuestions.order), asc(quizQuestions.createdAt));

  const questionIds = questions.map((q) => q.id);
  const options =
    questionIds.length === 0
      ? []
      : await db
          .select()
          .from(quizOptions)
          .where(inArray(quizOptions.questionId, questionIds))
          .orderBy(asc(quizOptions.order));

  const byQuestion = new Map<string, (typeof quizOptions.$inferSelect)[]>();
  for (const o of options) {
    const list = byQuestion.get(o.questionId) ?? [];
    list.push(o);
    byQuestion.set(o.questionId, list);
  }

  return {
    quiz,
    questions: questions.map((q) => ({ ...q, options: byQuestion.get(q.id) ?? [] })),
  };
}

function sanitizeForStudent(detail: QuizDetail): QuizDetail {
  return {
    quiz: detail.quiz,
    questions: detail.questions.map((q) => ({
      ...q,
      correctAnswer: null,
      explanation: null,
      options: q.options.map((o) => ({ ...o, isCorrect: false })),
    })),
  };
}

export const quizzesService = {
  async getByLesson(lessonId: string, actor: { id: string; role: Role }) {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1);

    if (!quiz) throw ApiError.notFound("Bu derse ait quiz bulunamadı");

    const detail = await loadQuizDetail(quiz.id);

    const [course] = await db
      .select({ instructorId: courses.instructorId })
      .from(lessons)
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (course && (actor.role === "admin" || course.instructorId === actor.id)) {
      return detail;
    }
    return sanitizeForStudent(detail);
  },

  async create(input: CreateQuizInput, actor: { id: string; role: Role }) {
    await assertLessonOwnership(input.lessonId, actor);

    const [existing] = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.lessonId, input.lessonId))
      .limit(1);
    if (existing) throw ApiError.conflict("Bu ders için zaten bir quiz mevcut");

    const created = await db.transaction(async (tx) => {
      const [quiz] = await tx
        .insert(quizzes)
        .values({
          lessonId: input.lessonId,
          title: input.title,
          description: input.description,
          passingScore: input.passingScore,
          timeLimit: input.timeLimit ?? null,
          maxAttempts: input.maxAttempts ?? null,
          shuffleQuestions: input.shuffleQuestions,
        })
        .returning();

      if (!quiz) throw ApiError.internal("Quiz oluşturulamadı");

      await insertQuestionsTree(tx, quiz.id, input.questions);
      return quiz;
    });

    return loadQuizDetail(created.id);
  },

  async update(
    quizId: string,
    input: UpdateQuizInput,
    actor: { id: string; role: Role },
  ) {
    await assertQuizOwnership(quizId, actor);

    await db.transaction(async (tx) => {
      const updates: Partial<typeof quizzes.$inferInsert> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.passingScore !== undefined) updates.passingScore = input.passingScore;
      if (input.timeLimit !== undefined) updates.timeLimit = input.timeLimit;
      if (input.maxAttempts !== undefined) updates.maxAttempts = input.maxAttempts;
      if (input.shuffleQuestions !== undefined)
        updates.shuffleQuestions = input.shuffleQuestions;

      if (Object.keys(updates).length > 0) {
        await tx
          .update(quizzes)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(quizzes.id, quizId));
      }

      if (input.questions) {
        await tx.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
        await insertQuestionsTree(tx, quizId, input.questions);
      }
    });

    return loadQuizDetail(quizId);
  },

  async delete(quizId: string, actor: { id: string; role: Role }) {
    await assertQuizOwnership(quizId, actor);
    await db.delete(quizzes).where(eq(quizzes.id, quizId));
  },

  async startAttempt(quizId: string, actor: { id: string; role: Role }) {
    await assertEnrolledOrInstructor(quizId, actor);

    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);
    if (!quiz) throw ApiError.notFound("Quiz bulunamadı");

    if (quiz.maxAttempts !== null) {
      const [used] = await db
        .select({ value: count() })
        .from(quizAttempts)
        .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, actor.id)));
      const usedCount = used?.value ?? 0;
      if (usedCount >= quiz.maxAttempts) {
        throw ApiError.forbidden("Maksimum deneme hakkını kullandınız");
      }
    }

    const [open] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.userId, actor.id),
          isNull(quizAttempts.submittedAt),
        ),
      )
      .limit(1);
    if (open) return open;

    const [attempt] = await db
      .insert(quizAttempts)
      .values({ quizId, userId: actor.id })
      .returning();
    if (!attempt) throw ApiError.internal("Deneme başlatılamadı");
    return attempt;
  },

  async submitAttempt(
    attemptId: string,
    input: SubmitAttemptInput,
    actor: { id: string; role: Role },
  ) {
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, attemptId))
      .limit(1);
    if (!attempt) throw ApiError.notFound("Deneme bulunamadı");
    if (attempt.userId !== actor.id && actor.role !== "admin") {
      throw ApiError.forbidden("Bu denemeye erişim yetkiniz yok");
    }
    if (attempt.submittedAt) throw ApiError.badRequest("Bu deneme zaten tamamlandı");

    const detail = await loadQuizDetail(attempt.quizId);
    const questionMap = new Map(detail.questions.map((q) => [q.id, q]));

    const totalPoints = detail.questions.reduce((sum, q) => sum + q.points, 0);
    let earnedPoints = 0;
    const answersToInsert: (typeof quizAnswers.$inferInsert)[] = [];

    for (const ans of input.answers) {
      const question = questionMap.get(ans.questionId);
      if (!question) continue;

      let isCorrect: boolean | null = null;
      let pointsEarned = 0;

      if (question.type === "open_ended") {
        isCorrect = null;
        pointsEarned = 0;
      } else {
        const correctIds = new Set(
          question.options.filter((o) => o.isCorrect).map((o) => o.id),
        );
        const selectedIds = new Set(ans.selectedOptionIds);

        const sameSize = correctIds.size === selectedIds.size;
        const allMatch =
          sameSize && [...correctIds].every((id) => selectedIds.has(id));
        isCorrect = allMatch;
        pointsEarned = allMatch ? question.points : 0;
      }

      earnedPoints += pointsEarned;
      answersToInsert.push({
        attemptId,
        questionId: question.id,
        selectedOptionIds: ans.selectedOptionIds,
        textAnswer: ans.textAnswer ?? null,
        isCorrect,
        pointsEarned,
      });
    }

    const score = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= detail.quiz.passingScore;

    const updated = await db.transaction(async (tx) => {
      await tx.delete(quizAnswers).where(eq(quizAnswers.attemptId, attemptId));
      if (answersToInsert.length > 0) {
        await tx.insert(quizAnswers).values(answersToInsert);
      }

      const [row] = await tx
        .update(quizAttempts)
        .set({
          score,
          earnedPoints,
          totalPoints,
          passed,
          submittedAt: new Date(),
        })
        .where(eq(quizAttempts.id, attemptId))
        .returning();
      if (!row) throw ApiError.internal("Deneme güncellenemedi");
      return row;
    });

    return this.getAttempt(updated.id, actor);
  },

  async getAttempt(attemptId: string, actor: { id: string; role: Role }) {
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, attemptId))
      .limit(1);
    if (!attempt) throw ApiError.notFound("Deneme bulunamadı");

    if (actor.role !== "admin" && attempt.userId !== actor.id) {
      const [own] = await db
        .select({ instructorId: courses.instructorId })
        .from(quizzes)
        .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
        .innerJoin(courses, eq(lessons.courseId, courses.id))
        .where(eq(quizzes.id, attempt.quizId))
        .limit(1);
      if (!own || own.instructorId !== actor.id) {
        throw ApiError.forbidden("Bu denemeye erişim yetkiniz yok");
      }
    }

    const answers = await db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.attemptId, attemptId));

    return { attempt, answers };
  },

  async listAttempts(quizId: string, actor: { id: string; role: Role }) {
    await assertEnrolledOrInstructor(quizId, actor);
    return db
      .select()
      .from(quizAttempts)
      .where(
        and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, actor.id)),
      )
      .orderBy(desc(quizAttempts.startedAt));
  },
};
