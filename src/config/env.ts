import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/**
 * Tüm env değişkenlerini Zod ile validate ediyoruz.
 * Process başlamadan eksik/yanlış env varsa hemen patlar - prod'da sürpriz olmaz.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default("/api"),

  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL gerekli"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET en az 16 karakter olmalı"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET en az 16 karakter olmalı"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  BCRYPT_SALT_ROUNDS: z.coerce.number().min(8).max(14).default(10),

  // E-posta
  APP_NAME: z.string().default("Online Education"),
  EMAIL_PROVIDER: z.enum(["console", "smtp", "resend"]).default("console"),
  EMAIL_FROM: z.string().default("Online Education <no-reply@online-education.test>"),
  // smtp provider (Mailtrap, Mailpit, Gmail vb.)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // resend provider
  RESEND_API_KEY: z.string().optional(),

  // Doğrulama / sıfırlama token süreleri
  EMAIL_VERIFICATION_EXPIRES_IN: z.string().default("24h"),
  PASSWORD_RESET_EXPIRES_IN: z.string().default("1h"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Geçersiz environment değişkenleri:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
