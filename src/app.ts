import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "@/config/env";
import routes from "@/routes";
import { errorHandler } from "@/middleware/error.middleware";
import { notFoundHandler } from "@/middleware/not-found.middleware";
import { requestLogger } from "@/middleware/request-logger.middleware";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());


  if (env.NODE_ENV !== "test") {
    app.use(requestLogger);
  }

  app.set("trust proxy", 1);


  app.use(env.API_PREFIX, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
