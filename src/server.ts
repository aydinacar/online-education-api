import { createApp } from "./app";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT}${env.API_PREFIX}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

/**
 * Graceful shutdown - SIGTERM/SIGINT geldiğinde mevcut istekleri tamamla, sonra kapan.
 * PM2/Docker düzgün restart edebilsin diye önemli.
 */
function shutdown(signal: string) {
  logger.info(`${signal} alındı, server kapatılıyor...`);
  server.close((err) => {
    if (err) {
      logger.error("Server kapatma hatası", err);
      process.exit(1);
    }
    logger.info("Server kapatıldı");
    process.exit(0);
  });

  // 10 saniye sonra zorla kapan
  setTimeout(() => {
    logger.error("Zorla kapatılıyor (timeout)");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
  shutdown("uncaughtException");
});
