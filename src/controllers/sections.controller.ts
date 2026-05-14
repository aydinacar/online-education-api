import type { Request, Response } from "express";
import { sectionsService } from "@/services/sections.service";
import { sendSuccess, sendCreated, sendNoContent } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const sectionsController = {
  listByCourse: async (req: Request<{ courseId: string }>, res: Response) => {
    const data = await sectionsService.listByCourse(req.params.courseId);
    sendSuccess(res, { data });
  },

  create: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const section = await sectionsService.create(req.body, req.user);
    sendCreated(res, section, "Bölüm oluşturuldu");
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const section = await sectionsService.update(
      req.params.id,
      req.body,
      req.user,
    );
    sendSuccess(res, { data: section });
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await sectionsService.delete(req.params.id, req.user);
    sendNoContent(res);
  },

  reorder: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await sectionsService.reorder(req.body, req.user);
    sendSuccess(res, { data });
  },
};
