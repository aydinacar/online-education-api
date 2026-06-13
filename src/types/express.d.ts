import type { Role } from "@/config/constants";

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
