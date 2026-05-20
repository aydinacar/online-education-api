import { z } from "zod";
import { QUESTION_TYPES } from "@/config/constants";

const optionInputSchema = z.object({
  text: z.string().min(1, "Seçenek metni boş olamaz").max(500),
  isCorrect: z.boolean().default(false),
  order: z.number().int().min(0).optional(),
});

const questionInputSchema = z
  .object({
    type: z.enum(QUESTION_TYPES),
    text: z.string().min(1, "Soru metni boş olamaz"),
    explanation: z.string().optional(),
    points: z.number().int().min(1).max(100).default(1),
    order: z.number().int().min(0).optional(),
    correctAnswer: z.string().optional(),
    options: z.array(optionInputSchema).default([]),
  })
  .superRefine((q, ctx) => {
    if (q.type === "open_ended") {
      if (q.options.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Açık uçlu sorularda seçenek bulunamaz",
        });
      }
      return;
    }

    if (q.type === "true_false") {
      if (q.options.length !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Doğru/Yanlış sorusu tam 2 seçenek içermeli",
        });
      }
    } else if (q.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "En az 2 seçenek gerekli",
      });
    }

    const correctCount = q.options.filter((o) => o.isCorrect).length;
    if (q.type === "single_choice" || q.type === "true_false") {
      if (correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Tam olarak 1 doğru seçenek olmalı",
        });
      }
    } else if (q.type === "multiple_choice" && correctCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "En az 1 doğru seçenek olmalı",
      });
    }
  });

export const createQuizSchema = z.object({
  body: z.object({
    lessonId: z.string().uuid("Geçerli bir ders seçin"),
    title: z.string().min(2).max(200),
    description: z.string().optional(),
    passingScore: z.number().int().min(0).max(100).default(70),
    timeLimit: z.number().int().min(10).nullable().optional(),
    maxAttempts: z.number().int().min(1).nullable().optional(),
    shuffleQuestions: z.boolean().default(false),
    questions: z.array(questionInputSchema).min(1, "En az 1 soru gerekli"),
  }),
});

export const updateQuizSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().nullable().optional(),
    passingScore: z.number().int().min(0).max(100).optional(),
    timeLimit: z.number().int().min(10).nullable().optional(),
    maxAttempts: z.number().int().min(1).nullable().optional(),
    shuffleQuestions: z.boolean().optional(),
    questions: z.array(questionInputSchema).min(1).optional(),
  }),
});

const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  textAnswer: z.string().optional(),
});

export const submitAttemptSchema = z.object({
  body: z.object({
    answers: z.array(submitAnswerSchema),
  }),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>["body"];
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>["body"];
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>["body"];
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type OptionInput = z.infer<typeof optionInputSchema>;
