import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { users, type User } from "@/db/schema";
import { hashPassword, comparePassword } from "@/utils/password";
import { ApiError } from "@/utils/api-error";
import { tokenService } from "./token.service";
import { verificationService } from "./verification.service";
import { emailService } from "./email.service";
import type { LoginInput, RegisterInput } from "@/validations/auth.schema";

export interface AuthResult {
  user: Omit<User, "passwordHash">;
  accessToken: string;
  refreshToken: string;
}

interface AuthContext {
  userAgent?: string;
  ipAddress?: string;
}

function sanitize(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  void passwordHash;
  return rest;
}

export const authService = {
  async register(input: RegisterInput, ctx?: AuthContext): Promise<AuthResult> {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      throw ApiError.conflict("Bu e-posta zaten kayıtlı");
    }

    const passwordHash = await hashPassword(input.password);

    const [user] = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        passwordHash,
      })
      .returning();

    if (!user) throw ApiError.internal("Kullanıcı oluşturulamadı");

    // Doğrulama maili - akışı bloklamasın (fire-and-forget)
    void authService.sendEmailVerification(user.id);

    const accessToken = tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await tokenService.issueRefreshToken(user.id, ctx);

    return { user: sanitize(user), accessToken, refreshToken };
  },

  async login(input: LoginInput, ctx?: AuthContext): Promise<AuthResult> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      throw ApiError.unauthorized("E-posta veya şifre hatalı");
    }

    const ok = await comparePassword(input.password, user.passwordHash);
    if (!ok) {
      throw ApiError.unauthorized("E-posta veya şifre hatalı");
    }

    const accessToken = tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await tokenService.issueRefreshToken(user.id, ctx);

    return { user: sanitize(user), accessToken, refreshToken };
  },

  /**
   * Refresh token ile yeni access + yeni refresh üretir (rotation).
   */
  async refresh(
    refreshToken: string,
    ctx?: AuthContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, tokenId } = await tokenService.verifyRefreshToken(refreshToken);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw ApiError.unauthorized("Kullanıcı bulunamadı");
    }

    const newRefreshToken = await tokenService.rotateRefreshToken(tokenId, userId, ctx);
    const accessToken = tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      const { tokenId } = await tokenService.verifyRefreshToken(refreshToken);
      await tokenService.revokeRefreshToken(tokenId);
    } catch {
      // Token zaten geçersiz - sessizce geç, idempotent olsun
    }
  },

  async me(userId: string): Promise<Omit<User, "passwordHash">> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw ApiError.notFound("Kullanıcı bulunamadı");
    }
    return sanitize(user);
  },

  /**
   * Verilen kullanıcı için doğrulama maili üretip gönderir.
   * Zaten doğrulanmışsa hiçbir şey yapmaz.
   */
  async sendEmailVerification(userId: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.isEmailVerified) return;

    const token = await verificationService.create(user.id, "email_verification");
    await emailService.sendEmailVerification(user.email, user.name, token);
  },

  /**
   * E-posta doğrulama token'ını tüketir, kullanıcıyı doğrulanmış işaretler.
   */
  async verifyEmail(token: string): Promise<void> {
    const userId = await verificationService.consume(token, "email_verification");
    if (!userId) {
      throw ApiError.badRequest("Geçersiz veya süresi dolmuş doğrulama bağlantısı");
    }

    const [user] = await db
      .update(users)
      .set({ isEmailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (user) {
      await emailService.sendWelcome(user.email, user.name);
    }
  },

  /**
   * Şifre sıfırlama isteği. Güvenlik için e-postanın kayıtlı olup olmadığını
   * sızdırmaz - her durumda sessizce başarılı döner.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return;

    const token = await verificationService.create(user.id, "password_reset");
    await emailService.sendPasswordReset(user.email, user.name, token);
  },

  /**
   * Token ile şifreyi sıfırlar, tüm oturumları sonlandırır.
   */
  async resetPassword(token: string, password: string): Promise<void> {
    const userId = await verificationService.consume(token, "password_reset");
    if (!userId) {
      throw ApiError.badRequest("Geçersiz veya süresi dolmuş sıfırlama bağlantısı");
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    // Şifre değişti - tüm refresh token'ları iptal et
    await tokenService.revokeAllUserTokens(userId);

    if (user) {
      await emailService.sendPasswordChanged(user.email, user.name);
    }
  },

  /**
   * Giriş yapmış kullanıcının mevcut şifresini doğrulayıp yenisiyle değiştirir.
   * Diğer oturumları sonlandırır.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw ApiError.notFound("Kullanıcı bulunamadı");
    }

    const ok = await comparePassword(currentPassword, user.passwordHash);
    if (!ok) {
      throw ApiError.badRequest("Mevcut şifre hatalı");
    }

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await tokenService.revokeAllUserTokens(userId);
    await emailService.sendPasswordChanged(user.email, user.name);
  },
};
