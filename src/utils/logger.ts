/**
 * Şimdilik basit console wrapper.
 * İleride Pino/Winston'a geçince sadece bu dosyayı değiştirmek yeter.
 */

const timestamp = () => new Date().toISOString();

export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(`[${timestamp()}] [INFO]`, message, meta ?? "");
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(`[${timestamp()}] [WARN]`, message, meta ?? "");
  },
  error: (message: string, meta?: unknown) => {
    console.error(`[${timestamp()}] [ERROR]`, message, meta ?? "");
  },
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[${timestamp()}] [DEBUG]`, message, meta ?? "");
    }
  },
};
