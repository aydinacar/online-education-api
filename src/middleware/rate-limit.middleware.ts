import rateLimit from "express-rate-limit";

/**
 * Genel API rate limit - tüm /api altında.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Çok fazla istek - lütfen biraz sonra tekrar deneyin",
    statusCode: 429,
  },
});

/**
 * Auth endpoint'leri için daha sıkı limit (brute force koruması).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Çok fazla giriş denemesi - 15 dakika sonra tekrar deneyin",
    statusCode: 429,
  },
});
