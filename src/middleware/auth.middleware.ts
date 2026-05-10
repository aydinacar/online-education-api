import type { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/api-error";
import { tokenService } from "@/services/token.service";

/**
 * Authorization: Bearer <accessToken> header'ını doğrular,
 * req.user'ı set eder. Geçersizse 401.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Token gerekli"));
  }

  const token = authHeader.slice(7); // "Bearer ".length

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    next(ApiError.unauthorized("Geçersiz veya süresi dolmuş token"));
  }
};

/**
 * Auth opsiyonel - token varsa user'ı set et, yoksa devam et.
 * Public endpoint'lerde "kullanıcı login mi" bilgisi lazımsa kullanılır.
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const payload = tokenService.verifyAccessToken(authHeader.slice(7));
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Token bozuksa sessizce geç
  }
  next();
};
