import type { Request, Response } from "express";
import { categoriesService } from "@/services/categories.service";
import { sendSuccess, sendCreated, sendNoContent } from "@/utils/api-response";

export const categoriesController = {
  list: async (_req: Request, res: Response) => {
    const data = await categoriesService.list();
    sendSuccess(res, { data });
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    const data = await categoriesService.getById(req.params.id);
    sendSuccess(res, { data });
  },

  create: async (req: Request, res: Response) => {
    const category = await categoriesService.create(req.body);
    sendCreated(res, category);
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    const category = await categoriesService.update(req.params.id, req.body);
    sendSuccess(res, { data: category });
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    await categoriesService.delete(req.params.id);
    sendNoContent(res);
  },
};
