import type { Request, Response, NextFunction } from "express";
import type { Role } from "@/config/constants";
import { ApiError } from "@/utils/api-error";

/**
 * Belirli rol(ler)deki kullanıcıların erişebileceği route'lar için.
 * authenticate middleware'inden SONRA çağrılmalı.
 *
 * Kullanım:
 *   router.delete("/:id", authenticate, requireRole("admin"), controller.delete);
 *   router.post("/", authenticate, requireRole("admin", "instructor"), controller.create);
 */
export const requireRole =
  (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Token gerekli"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("Bu işlem için yetkiniz yok"));
    }
    next();
  };
