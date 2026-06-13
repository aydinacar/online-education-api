import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { users, type User } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { hashPassword, comparePassword } from "@/utils/password";
import type {
  UpdateProfileInput,
  ChangePasswordInput,
} from "@/validations/user.schema";
import { tokenService } from "./token.service";

function sanitize(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  void passwordHash;
  return rest;
}

export const usersService = {
  async getById(id: string): Promise<Omit<User, "passwordHash">> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw ApiError.notFound("Kullanıcı bulunamadı");
    return sanitize(user);
  },

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<Omit<User, "passwordHash">> {
    const [user] = await db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) throw ApiError.notFound("Kullanıcı bulunamadı");
    return sanitize(user);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw ApiError.notFound("Kullanıcı bulunamadı");

    const ok = await comparePassword(input.currentPassword, user.passwordHash);
    if (!ok) throw ApiError.badRequest("Mevcut şifre hatalı");

    const passwordHash = await hashPassword(input.newPassword);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await tokenService.revokeAllUserTokens(userId);
  },
};
