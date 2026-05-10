import type { Request, Response } from "express";
import { usersService } from "@/services/users.service";
import { sendSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const usersController = {
  getMe: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await usersService.getById(req.user.id);
    sendSuccess(res, { data: user });
  },

  updateMe: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await usersService.updateProfile(req.user.id, req.body);
    sendSuccess(res, { data: user, message: "Profil güncellendi" });
  },

  changePassword: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await usersService.changePassword(req.user.id, req.body);
    sendSuccess(res, { data: null, message: "Şifre değiştirildi - tekrar giriş yapın" });
  },
};
