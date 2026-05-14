import type { Request, Response } from "express";
import { coursesService } from "@/services/courses.service";
import { enrollmentsService } from "@/services/enrollments.service";
import { sendSuccess, sendCreated, sendNoContent } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";
import type { CourseFilterInput } from "@/validations/course.schema";

export const coursesController = {
  list: async (req: Request, res: Response) => {
    const result = await coursesService.list(
      req.query as unknown as CourseFilterInput,
      req.user ? { role: req.user.role } : undefined,
    );
    sendSuccess(res, { data: result.data, meta: result.meta });
  },

  getBySlug: async (req: Request<{ slug: string }>, res: Response) => {
    const course = await coursesService.getBySlug(
      req.params.slug,
      req.user ? { id: req.user.id, role: req.user.role } : undefined,
    );
    sendSuccess(res, { data: course });
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    const course = await coursesService.getById(req.params.id);
    sendSuccess(res, { data: course });
  },

  getCurriculum: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await coursesService.getCurriculum(req.params.id, req.user);
    sendSuccess(res, { data });
  },

  myCourses: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await enrollmentsService.myCourses(req.user.id);
    sendSuccess(res, { data });
  },

  teaching: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await coursesService.listByInstructor(req.user.id);
    sendSuccess(res, { data });
  },

  create: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const course = await coursesService.create(req.user.id, req.body);
    sendCreated(res, course, "Kurs oluşturuldu");
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const course = await coursesService.update(req.params.id, req.body, req.user);
    sendSuccess(res, { data: course, message: "Kurs güncellendi" });
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await coursesService.delete(req.params.id, req.user);
    sendNoContent(res);
  },

  enroll: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const enrollment = await enrollmentsService.enroll(req.user.id, req.params.id);
    sendCreated(res, enrollment, "Kursa kayıt olundu");
  },
};
