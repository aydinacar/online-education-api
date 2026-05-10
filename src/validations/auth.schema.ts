import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalı").max(100),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalı")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli")
      .regex(/[a-z]/, "Şifre en az bir küçük harf içermeli")
      .regex(/[0-9]/, "Şifre en az bir rakam içermeli"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z.string().min(1, "Şifre gerekli"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token gerekli"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
