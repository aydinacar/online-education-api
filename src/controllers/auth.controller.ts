import type { Request, Response } from "express";
import { authService } from "@/services/auth.service";
import { sendSuccess, sendCreated } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
} from "@/utils/cookies";

export const authController = {
  register: async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    sendCreated(res, { user }, "Kayıt başarılı");
  },

  login: async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    sendSuccess(res, { data: { user }, message: "Giriş başarılı" });
  },

  refresh: async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw ApiError.unauthorized("Refresh token bulunamadı");
    }
    const tokens = await authService.refresh(refreshToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    setAccessTokenCookie(res, tokens.accessToken);
    setRefreshTokenCookie(res, tokens.refreshToken);
    sendSuccess(res, { data: { success: true } });
  },

  logout: async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    clearAuthCookies(res);
    sendSuccess(res, { data: null, message: "Çıkış yapıldı" });
  },

  me: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.me(req.user.id);
    sendSuccess(res, { data: user });
  },
};
