import type { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/api-error";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    if (!err.isOperational) {
      logger.error("Operational olmayan hata", { err, path: req.path });
    }

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      statusCode: err.statusCode,
    });
  }

  logger.error("Beklenmeyen hata", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    message: env.NODE_ENV === "production" ? "Sunucu hatası" : err.message,
    ...(env.NODE_ENV !== "production" && { stack: err.stack }),
    statusCode: 500,
  });
};
