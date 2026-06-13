import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { VERIFICATION_TOKEN_TYPES } from "@/config/constants";

export const verificationTokenTypeEnum = pgEnum(
  "verification_token_type",
  VERIFICATION_TOKEN_TYPES,
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    type: verificationTokenTypeEnum("type").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: index("verification_tokens_token_hash_idx").on(table.tokenHash),
    userTypeIdx: index("verification_tokens_user_type_idx").on(table.userId, table.type),
  }),
);

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
