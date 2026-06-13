import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "@/config/database";
import { verificationTokens } from "@/db/schema";
import { env } from "@/config/env";
import { randomToken, sha256 } from "@/utils/crypto";
import { expiresInMs } from "@/utils/duration";
import type { VerificationTokenType } from "@/config/constants";

const EXPIRY_BY_TYPE: Record<VerificationTokenType, string> = {
  email_verification: env.EMAIL_VERIFICATION_EXPIRES_IN,
  password_reset: env.PASSWORD_RESET_EXPIRES_IN,
};

export const verificationService = {
  async create(userId: string, type: VerificationTokenType): Promise<string> {
    await db
      .update(verificationTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(verificationTokens.userId, userId),
          eq(verificationTokens.type, type),
          isNull(verificationTokens.usedAt),
        ),
      );

    const token = randomToken();
    const expiresAt = new Date(Date.now() + expiresInMs(EXPIRY_BY_TYPE[type]));

    await db.insert(verificationTokens).values({
      userId,
      tokenHash: sha256(token),
      type,
      expiresAt,
    });

    return token;
  },

  async consume(token: string, type: VerificationTokenType): Promise<string | null> {
    const tokenHash = sha256(token);

    const [record] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.tokenHash, tokenHash),
          eq(verificationTokens.type, type),
          isNull(verificationTokens.usedAt),
          gt(verificationTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!record) return null;

    await db
      .update(verificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(verificationTokens.id, record.id));

    return record.userId;
  },
};
