import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

/**
 * Async controller'ları sarar - her birine try/catch yazmamak için.
 * Hata olursa next(err)'e gider, error middleware yakalar.
 *
 * Generic - typed Request<{ id: string }> gibi imzaları da kabul eder.
 * Bu sayede req.params.id "string | undefined" değil, "string" olarak gelir.
 */
export const asyncHandler =
  <
    P = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = ParsedQs,
  >(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response<ResBody>,
      next: NextFunction,
    ) => Promise<unknown>,
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
