import type { Response } from "express";

interface SuccessResponseOptions<T> {
  data: T;
  message?: string;
  meta?: object;
  statusCode?: number;
}

/**
 * Tüm başarılı response'lar bu şekille döner:
 * { success: true, data: ..., message?, meta? }
 */
export function sendSuccess<T>(
  res: Response,
  { data, message, meta, statusCode = 200 }: SuccessResponseOptions<T>,
) {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
    ...(meta && { meta }),
  });
}

export function sendCreated<T>(res: Response, data: T, message = "Oluşturuldu") {
  return sendSuccess(res, { data, message, statusCode: 201 });
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
