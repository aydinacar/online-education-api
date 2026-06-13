import type { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/api-error";
import { tokenService } from "@/services/token.service";
import { ACCESS_TOKEN_COOKIE } from "@/utils/cookies";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token) {
    return next(ApiError.unauthorized("Token gerekli"));
  }

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

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (!token) {
    return next();
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
  }
  next();
};
