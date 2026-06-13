import type { Request, Response } from "express";
import { certificatesService } from "@/services/certificates.service";
import { enrollmentsService } from "@/services/enrollments.service";
import { sendSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const certificatesController = {
  myCertificates: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await certificatesService.listByUser(req.user.id);
    sendSuccess(res, { data });
  },

  myCourseCertificate: async (req: Request<{ courseId: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await enrollmentsService.recalculateProgress(req.user.id, req.params.courseId);
    const cert = await certificatesService.getByUserAndCourse(
      req.user.id,
      req.params.courseId,
    );
    if (!cert) throw ApiError.notFound("Bu kurs için sertifikan yok (henüz tamamlanmadı)");
    sendSuccess(res, { data: cert });
  },

  verify: async (req: Request<{ number: string }>, res: Response) => {
    const data = await certificatesService.getByNumber(req.params.number);
    sendSuccess(res, { data });
  },
};
