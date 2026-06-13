import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import { ApiError } from "@/utils/api-error";

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed && typeof parsed === "object") {
        const p = parsed as { body?: unknown; query?: unknown; params?: unknown };
        if (p.body) req.body = p.body;
        if (p.query) Object.assign(req.query, p.query);
        if (p.params) Object.assign(req.params, p.params);
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.slice(1).join(".");
          const key = path || issue.path.join(".");
          if (!errors[key]) errors[key] = [];
          errors[key].push(issue.message);
        }
        return next(ApiError.badRequest("Validasyon hatası", errors));
      }
      next(err);
    }
  };
