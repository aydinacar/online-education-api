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

  forgotPassword: async (req: Request, res: Response) => {
    await authService.requestPasswordReset(req.body.email);
    // Her zaman aynı yanıt - e-posta varlığını sızdırma
    sendSuccess(res, {
      data: null,
      message: "E-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi",
    });
  },

  resetPassword: async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    clearAuthCookies(res);
    sendSuccess(res, { data: null, message: "Şifren güncellendi, tekrar giriş yap" });
  },

  verifyEmail: async (req: Request, res: Response) => {
    await authService.verifyEmail(req.body.token);
    sendSuccess(res, { data: null, message: "E-posta adresin doğrulandı" });
  },

  resendVerification: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.sendEmailVerification(req.user.id);
    sendSuccess(res, { data: null, message: "Doğrulama bağlantısı gönderildi" });
  },

  changePassword: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    clearAuthCookies(res);
    sendSuccess(res, { data: null, message: "Şifren değiştirildi, tekrar giriş yap" });
  },
};
