import type { Request, Response } from "express";
import { reviewsService } from "@/services/reviews.service";
import { sendSuccess, sendCreated, sendNoContent } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const reviewsController = {
  listByCourse: async (req: Request<{ courseId: string }>, res: Response) => {
    const data = await reviewsService.listByCourse(req.params.courseId);
    sendSuccess(res, { data });
  },

  create: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const review = await reviewsService.create(req.user.id, req.body);
    sendCreated(res, review);
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const review = await reviewsService.update(req.params.id, req.user.id, req.body);
    sendSuccess(res, { data: review });
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await reviewsService.delete(req.params.id, req.user.id, req.user.role === "admin");
    sendNoContent(res);
  },
};
