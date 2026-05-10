import express, { type Express } from "express";
import cors from "cors";
//import helmet from "helmet";
//import compression from "compression";
import cookieParser from "cookie-parser";

import { env } from "@/config/env";
import routes from "@/routes";
import { errorHandler } from "@/middleware/error.middleware";
import { notFoundHandler } from "@/middleware/not-found.middleware";
import { requestLogger } from "@/middleware/request-logger.middleware";
//import { apiLimiter } from "@/middleware/rate-limit.middleware";

export function createApp(): Express {
  const app = express();

  // Güvenlik
  //app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );

  // Parser'lar
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // Performance
  //app.use(compression());

  // Logging - request bazlı
  if (env.NODE_ENV !== "test") {
    app.use(requestLogger);
  }

  // Reverse proxy arkasında req.ip'nin doğru olması için
  app.set("trust proxy", 1);

  // Rate limit (API prefix altında)
  //app.use(env.API_PREFIX, apiLimiter);

  // Routes
  app.use(env.API_PREFIX, routes);

  // 404 + error handler en sonda
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
