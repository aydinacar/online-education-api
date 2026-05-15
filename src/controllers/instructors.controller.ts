import type { Request, Response } from "express";
import { instructorsService } from "@/services/instructors.service";
import { sendSuccess } from "@/utils/api-response";
import type { InstructorFilterInput } from "@/validations/instructor.schema";

export const instructorsController = {
  list: async (req: Request, res: Response) => {
    const result = await instructorsService.list(req.query as InstructorFilterInput);
    sendSuccess(res, { data: result.data, meta: result.meta });
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    const instructor = await instructorsService.getById(req.params.id);
    sendSuccess(res, { data: instructor });
  },
};
