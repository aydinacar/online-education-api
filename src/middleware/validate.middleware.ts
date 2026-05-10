import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import { ApiError } from "@/utils/api-error";

/**
 * Zod şemasıyla body/query/params validate eder.
 * Şema şu yapıda olmalı: z.object({ body?, query?, params? })
 *
 * Validate ettikten sonra parsed değerleri req.body/query/params'a yazar
 * (string'leri number'a çevirme gibi coerce dönüşümlerinin etkili olması için).
 */
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
          // body.email -> "email", query.page -> "page"
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
