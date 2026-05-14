import type { Request, Response } from "express";
import { instructorApplicationsService } from "@/services/instructor-applications.service";
import { sendSuccess, sendCreated } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";
import type {
  ListInstructorApplicationsInput,
} from "@/validations/instructor-application.schema";

export const instructorApplicationsController = {
  list: async (req: Request, res: Response) => {
    const result = await instructorApplicationsService.list(
      req.query as unknown as ListInstructorApplicationsInput,
    );
    sendSuccess(res, { data: result.data, meta: result.meta });
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    const data = await instructorApplicationsService.getById(req.params.id);
    sendSuccess(res, { data });
  },

  getMine: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await instructorApplicationsService.getMine(req.user.id);
    sendSuccess(res, { data });
  },

  create: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await instructorApplicationsService.create(req.user.id, req.body);
    sendCreated(res, data, "Başvurun alındı");
  },

  approve: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await instructorApplicationsService.approve(
      req.params.id,
      req.user,
      req.body,
    );
    sendSuccess(res, { data, message: "Başvuru onaylandı" });
  },

  reject: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await instructorApplicationsService.reject(
      req.params.id,
      req.user,
      req.body,
    );
    sendSuccess(res, { data, message: "Başvuru reddedildi" });
  },
};
