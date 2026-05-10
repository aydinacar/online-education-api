import type { Request, Response } from "express";
import { paymentsService } from "@/services/payments.service";
import { sendSuccess, sendCreated } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const paymentsController = {
  myPayments: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await paymentsService.listByUser(req.user.id);
    sendSuccess(res, { data });
  },

  create: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const payment = await paymentsService.create(req.user.id, req.body);
    sendCreated(res, payment);
  },

  updateStatus: async (req: Request<{ id: string }>, res: Response) => {
    const payment = await paymentsService.updateStatus(req.params.id, req.body);
    sendSuccess(res, { data: payment });
  },
};
