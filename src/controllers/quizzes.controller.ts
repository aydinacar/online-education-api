import type { Request, Response } from "express";
import { quizzesService } from "@/services/quizzes.service";
import { sendSuccess, sendCreated, sendNoContent } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const quizzesController = {
  getByLesson: async (req: Request<{ lessonId: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await quizzesService.getByLesson(req.params.lessonId, req.user);
    sendSuccess(res, { data });
  },

  create: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await quizzesService.create(req.body, req.user);
    sendCreated(res, data, "Quiz oluşturuldu");
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await quizzesService.update(req.params.id, req.body, req.user);
    sendSuccess(res, { data });
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await quizzesService.delete(req.params.id, req.user);
    sendNoContent(res);
  },

  startAttempt: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await quizzesService.startAttempt(req.params.id, req.user);
    sendCreated(res, data, "Deneme başlatıldı");
  },

  submitAttempt: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await quizzesService.submitAttempt(req.params.id, req.body, req.user);
    sendSuccess(res, { data });
  },

  getAttempt: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await quizzesService.getAttempt(req.params.id, req.user);
    sendSuccess(res, { data });
  },

  listAttempts: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await quizzesService.listAttempts(req.params.id, req.user);
    sendSuccess(res, { data });
  },
};
