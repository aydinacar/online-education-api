import type { Role } from "@/config/constants";

/**
 * Auth middleware doğrulama yaptıktan sonra req.user'ı set eder.
 * Bu module augmentation sayesinde controller'larda req.user.id tip alır.
 */
declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      role: Role;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
