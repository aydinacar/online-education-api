import type { Request, Response } from "express";
import { enrollmentsService } from "@/services/enrollments.service";
import { sendSuccess, sendCreated } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const enrollmentsController = {
  myCourses: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await enrollmentsService.myCourses(req.user.id);
    sendSuccess(res, { data });
  },

  enroll: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const enrollment = await enrollmentsService.enroll(req.user.id, req.body.courseId);
    sendCreated(res, enrollment);
  },
};
