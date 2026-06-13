import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, index, AnyPgColumn } from "drizzle-orm/pg-core";
import { ROLES } from "@/config/constants";

export const roleEnum = pgEnum("role", [ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    avatar: text("avatar"),
    bio: text("bio"),
    headline: varchar("headline", { length: 200 }),
    website: varchar("website", { length: 255 }),
    twitter: varchar("twitter", { length: 50 }),
    linkedin: varchar("linkedin", { length: 100 }),
    role: roleEnum("role").notNull().default(ROLES.STUDENT),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    workspaceId: uuid("workspace_id").references((): AnyPgColumn => workspaces.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: index("users_workspace_idx").on(table.workspaceId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

import { workspaces } from "./workspaces";
