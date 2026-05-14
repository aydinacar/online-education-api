import type { Request, Response } from "express";
import { lessonsService } from "@/services/lessons.service";
import { sendSuccess, sendCreated, sendNoContent } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const lessonsController = {
  getById: async (req: Request<{ id: string }>, res: Response) => {
    const lesson = await lessonsService.getById(req.params.id);
    sendSuccess(res, { data: lesson });
  },

  getByCourse: async (req: Request<{ courseId: string }>, res: Response) => {
    const data = await lessonsService.getByCourse(req.params.courseId);
    sendSuccess(res, { data });
  },

  create: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const lesson = await lessonsService.create(req.body, req.user);
    sendCreated(res, lesson, "Ders eklendi");
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const lesson = await lessonsService.update(req.params.id, req.body, req.user);
    sendSuccess(res, { data: lesson });
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await lessonsService.delete(req.params.id, req.user);
    sendNoContent(res);
  },

  reorder: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await lessonsService.reorder(req.body, req.user);
    sendSuccess(res, { data });
  },

  markCompleted: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const progress = await lessonsService.markCompleted(req.user.id, req.params.id);
    sendSuccess(res, { data: progress });
  },

  updateProgress: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const progress = await lessonsService.updateProgress(
      req.user.id,
      req.params.id,
      req.body.watchedSeconds,
    );
    sendSuccess(res, { data: progress });
  },
};
