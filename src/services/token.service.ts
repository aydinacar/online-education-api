import jwt, { type SignOptions } from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db } from "@/config/database";
import { env } from "@/config/env";
import { refreshTokens } from "@/db/schema";
import type { Role } from "@/config/constants";
import { ApiError } from "@/utils/api-error";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

interface RefreshTokenContext {
  userAgent?: string;
  ipAddress?: string;
}

function expiresInMs(input: string): number {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? 1000);
}

export const tokenService = {
  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as SignOptions);
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  },

  async issueRefreshToken(userId: string, ctx?: RefreshTokenContext): Promise<string> {
    const expiresAt = new Date(Date.now() + expiresInMs(env.JWT_REFRESH_EXPIRES_IN));

    const [record] = await db
      .insert(refreshTokens)
      .values({
        userId,
        token: "",
        expiresAt,
        userAgent: ctx?.userAgent,
        ipAddress: ctx?.ipAddress,
      })
      .returning();

    if (!record) throw ApiError.internal("Refresh token oluşturulamadı");

    const token = jwt.sign({ sub: userId, jti: record.id }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);

    await db
      .update(refreshTokens)
      .set({ token })
      .where(eq(refreshTokens.id, record.id));

    return token;
  },

  async verifyRefreshToken(token: string): Promise<{ userId: string; tokenId: string }> {
    let payload: RefreshTokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch {
      throw ApiError.unauthorized("Geçersiz refresh token");
    }

    const [record] = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.id, payload.jti), eq(refreshTokens.token, token)))
      .limit(1);

    if (!record) {
      throw ApiError.unauthorized("Refresh token bulunamadı");
    }
    if (record.isRevoked) {
      throw ApiError.unauthorized("Refresh token iptal edilmiş");
    }
    if (record.expiresAt < new Date()) {
      throw ApiError.unauthorized("Refresh token süresi dolmuş");
    }

    return { userId: record.userId, tokenId: record.id };
  },

  async rotateRefreshToken(
    oldTokenId: string,
    userId: string,
    ctx?: RefreshTokenContext,
  ): Promise<string> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where(eq(refreshTokens.id, oldTokenId));

    return this.issueRefreshToken(userId, ctx);
  },

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where(eq(refreshTokens.id, tokenId));
  },

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.isRevoked, false)));
  },
};
