import type { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/api-error";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route bulunamadı: ${req.method} ${req.originalUrl}`));
};
