import type { Request, Response } from "express";
import { authService } from "@/services/auth.service";
import { sendSuccess, sendCreated } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const authController = {
  register: async (req: Request, res: Response) => {
    const result = await authService.register(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    sendCreated(res, result, "Kayıt başarılı");
  },

  login: async (req: Request, res: Response) => {
    const result = await authService.login(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    sendSuccess(res, { data: result, message: "Giriş başarılı" });
  },

  refresh: async (req: Request, res: Response) => {
    const tokens = await authService.refresh(req.body.refreshToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    sendSuccess(res, { data: tokens });
  },

  logout: async (req: Request, res: Response) => {
    await authService.logout(req.body.refreshToken);
    sendSuccess(res, { data: null, message: "Çıkış yapıldı" });
  },

  me: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.me(req.user.id);
    sendSuccess(res, { data: user });
  },
};
